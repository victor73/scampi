#!/usr/bin/node

var fs = require('fs');
var ini = require('inireader');
var commander = require('commander');
var stomp = require('stomp');
var spawn = require('child_process').spawn;
var fork = require('child_process').fork;
var _ = require('underscore');
var path = require('path');
var sleep = require('sleep');
var log4js = require('log4js');

var client_id;
var stdlog = console.log; // Save the old log function
var logger = null;
var message_count = 0;
var messaging_server;
var messaging_port; 
var debug = false;

function setup(callback) {
    commander.option('-c, --config <path>',
                     'Specify an alternate configuration file path.')
             .option('-l, --listen <path>',
                     'Specify the path to the listeners configuration JSON file.')
             .option('--logfile <path>',
                     'Specify the path to the logfile (overrides log configuration directive).')
             .parse(process.argv);

    var parser = new ini.IniReader();

    // Load and parse the configuration file. Take into account whether an
    // alternate (non-default) configuration file path was specified or not.
    var config_path = commander.config;

    if (config_path === null || typeof config_path === 'undefined') {
        config_path = path.join(__dirname, "conf", "config.ini");
    }

    parser.load(config_path);

    // Determine if we are in debug mode or not
    var debug_param = parser.param("global.debug");

    if (debug_param.trim().toLowerCase() === "true") {
        debug = true;
    }

    // First honor the command line option. If not provided, then use the setting in the
    // configuration file. If there is nothing there either, then we log locally.
    var log_file = commander.logfile;

    if (log_file === null || log_file.length === 0) {
        log_file = parser.param("global.logfile");
        if (log_file === null || log_file.length === 0) {
            console.log("No logfile config item found under the 'global' " +
                        "section. Using logs/listener.log");
            log_file = path.join(__dirname, "logs", "listener.log");
        }
    }

    // Okay, we know where to log to, so set up the logger...
    set_logging(log_file.trim());
    logger.info("Log file used: " + log_file);

    messaging_server = parser.param("messaging.messaging_server");
    messaging_port = parser.param("messaging.messaging_port");
    messaging_port = parser.param("messaging.messaging_port");
    client_id = parser.param("messaging.client_id");

    // Load and parse the configuration file. Take into account whether an
    // alternate (non-default) configuration file path was specified or not.
    var listener_json_path = commander.listen;

    if (listener_json_path === null || typeof listener_json_path === 'undefined') {
        listener_json_path = path.join(__dirname, "conf", "listen.json");
    }

    start_listening(listener_json_path, callback);
}

function start_listening(listener_path, callback) {
    logger.debug("Reading in the listener configuration from " + listener_path);

    fs.readFile(listener_path, function (err, data) {
        if (err) {
            logger.error("Problem reading the listern descriptor.", err);
            throw err;
        }

        var endpoints = null;
        try {
            endpoints = JSON.parse(data);
        } catch (parse_error) {
            logger.error("Unable to parse JSON listener descriptor.", parse_error);
        }

        if (endpoints !== null) {
            // login and passcode are optional (required by rabbitMQ)
            var stomp_args = {
                host: messaging_server,
                port: messaging_port,
                'client-id': client_id,
                debug: debug
            };

            var client = new stomp.Stomp(stomp_args);

            callback(client, endpoints);
        } else {
            logger.error("No endpoint data. Exiting.");
            process.exit(1);
        }
    });
}

function setup_listeners(client, endpoints) {
    logger.debug("In setup_listeners.");

    // Suppress the STDOUT on bad connections    
    console.log = function(e) {};

    client.on('connected', function() {
        // Restore regular console.log
        console.log = stdlog;
        logger.info("Connected to " + messaging_server + ".");

        var destination = null;

        for (destination in endpoints) {
            var headers = {  destination: destination,
                             'activemq.subcriptionName': client_id,
                             'activemq.subscriptionName': client_id,
                             ack: "client"
                          };
            logger.info("Subscribing to " + destination);
            client.subscribe(headers);
        }
    });

    client.on('message', function(message) {
        var message_id = message['headers']['message-id'];
        client.ack(message_id);
        message_count++;

        logger.debug("Got message #" + message_count + ". ID: " + message_id);

        if ( endpoints.hasOwnProperty(message['headers']['destination']) ) {
            var consumers = endpoints[ message['headers']['destination'] ];

            _.each( consumers, function(consumer) {
                var text = message['body'][0];

                if (consumer.hasOwnProperty('user') && consumer.hasOwnProperty('script')) {

                    var script = consumer['script'];
                    var username = consumer['user'];

                    var job_spec = { text: text,
                                     user: username,
                                     script: script };

                    console.log("Invoking " + script + " as user: " + username);

                    try {
                        var forked = fork("forked.js");

                        forked.send(job_spec);
                    } catch (e) {
                        console.log("Error invoking " + script);
                    }
                } else {
                    console.log("Invalid spec encountered. Both 'user' and 'script' and required.");
                }
            });
        }
    });

    client.on('error', function(error_frame) {
        console.error("Error: " + error_frame['body']);
        reconnect(client);
    });

    client.connect({'client-id': client_id });
}

function reconnect(client) {
    logger.debug("In reconnect.");

    if (client !== null && typeof(client) !== "undefined") {
        logger.debug("Disconnecting.");
        client.disconnect();
    }
    client = null;

    // Have a 10 second pause before we re-establish ourselves.
    var sleepSecs = 10;

    logger.debug("Sleeping for " + sleepSecs + " seconds.");
    sleep.sleep(sleepSecs);

    setup(function(c, endpoints) {
        client = c;
        setup_listeners(client, endpoints);
    });
}

function set_logging(log_file) {
    log4js.clearAppenders();
    log4js.loadAppender('file');
    log4js.loadAppender('console');
    log4js.addAppender(log4js.appenders.file(log_file), 'main');
    log4js.addAppender(log4js.appenders.console(log4js.messagePassThroughLayout), 'console');

    // Set the logger
    logger = log4js.getLogger('main');
}

function main() {
    var client;

    setup(function(new_client, endpoints) {
        client = new_client;
        setup_listeners(client, endpoints);
    });

    process.on('SIGTERM', function() {
        logger.info("Detected termination.");

        if (client !== null && typeof(client) !== "undefined") {
            logger.info("Disconnecting...");
            client.disconnect();
            client = null;
        }
        process.exit(1);
    });

    process.on('SIGINT', function() {
        logger.info("Detected interruption.");

        if (client !== null && typeof(client) !== "undefined") {
            logger.info("Disconnecting...");
            client.disconnect();
            client = null;
        }
        process.exit(1);
    });

    process.on('uncaughtException', function(err) {
        logger.error("Caught exception: ", err);
        console.log(err.stack);
    });
}

main();

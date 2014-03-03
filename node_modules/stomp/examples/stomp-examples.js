module.exports = function Examples() {
    "use strict";

    var debug, params, util, log, stompSettings;

    var Stomp;

    var getParams = function(){
        return params;
    };

    var init = function(debugInit, paramsInit) {
        debug = debugInit;
        params = paramsInit;
        util = require('util');
        Stomp = require('../lib/stomp.js');
        var StompLogger = require('../lib/stomp.logger.js');
        log = new StompLogger(debug);

        log.info('initializing example...');

        if (!params) {
            params = "Publisher";
        }

        log.debug('params: ' + params);

        stompSettings = {
            "host" : "localhost",
            "port" : 61613,
            "user" : "guest",
            "password" : "guest",
            "debug" : debug
        };

        return this;
    };

    var execute = function() {
        log.info('executing example...');
        stompConnect();
    };

    var stompConnect = function() {

        var stompArgs = {
            host: stompSettings.host,
            port: stompSettings.port,
            login: stompSettings.user,
            passcode: stompSettings.password,
            debug: stompSettings.debug
        };

        // login only important if using security on the MQ end
        if (params === 'ListenerA') {
            stompArgs.login = "siteAuser1";
            stompArgs.passcode = "siteAuser1";
        } else if (params === 'ListenerB') {
            stompArgs.login = "siteBuser1";
            stompArgs.passcode = "siteBuser1";
        } else if (params === 'ListenerC') {
            stompArgs.login = "siteCuser1";
            stompArgs.passcode = "siteCuser1";
        } else if (params === 'ListenerAll') {
            stompArgs.login = "alluser2";
            stompArgs.passcode = "alluser2";
        } else if (params === 'Publisher') {
            stompArgs.login = "alluser1";
            stompArgs.passcode = "alluser1";
        }
        log.debug(util.format("login:" + stompArgs.login));


        var stompClient =  new Stomp().Client(stompArgs);

        stompClient.on('connected', function () {
            log.info(util.format("stomp.onConnected"));

            runStomp(stompClient, function(err, result){
                if (err) {log.error(err);}
                log.debug('result', result);
                exit();
            });
        });

        stompClient.on('receipt', function (receipt) {
            log.debug(util.format("stomp.onReceipt %s", receipt));
        });

        stompClient.on('error', function (errorFrame) {
            log.error(util.format("stomp.onError %s", JSON.stringify(errorFrame)));
            stompClient.disconnect();
            exit();
        });

        stompClient.on('SIGINT', function () {
            log.warn(util.format("stomp.onSIGINT"));
            stompClient.disconnect();
            exit();
        });

        stompClient.connect();
    };

    var runStomp = function(stompClient, callback) {

        try
        {
            var topic = "/topic/";
            var queue = "/queue/";
            var baseQueueName = "%sSite.%s";
            var queueNameSiteA = util.format(baseQueueName, topic, "A");
            var queueNameSiteB = util.format(baseQueueName, queue, "B");
            var queueNameSiteC = util.format(baseQueueName, topic, "C");

            var baseRoutingKey = "command.siteCode%s.msgId%d";

            var message, routingKey;


            if (params === 'ListenerA') {
                // listener for site A
                listener(stompClient, queueNameSiteA, "", processMessage);
            } else if (params === 'ListenerB') {
                // listener for site B
                listener(stompClient, queueNameSiteB, "", processMessage);
            } else if (params === 'ListenerC') {
                // listener for site C
                listener(stompClient, queueNameSiteC, "", processMessage);
            } else if (params === 'ListenerAll') {
                // listener for site ALL
                //var allQueues = util.format(baseQueueName, baseQueueType, "*");
                // all queues with wild card doesn't work, errors on stomp.js:299

                var allQueues = [queueNameSiteA, queueNameSiteB,queueNameSiteC];
                listener(stompClient, allQueues, "", processMessage);
            } else if (params === 'Publisher') {
                // publish 3 messages for A
                message = {message: "msg1 for A", queue: "A", msgId: 1};
                routingKey = util.format(baseRoutingKey, message.queue, message.msgId);
                publishMessage(stompClient, message, queueNameSiteA, routingKey);

                message = {message: "msg2 for A", queue: "A", msgId: 2};
                routingKey = util.format(baseRoutingKey, message.queue, message.msgId);
                publishMessage(stompClient, message, queueNameSiteA, routingKey);

                message = {message: "msg3 for A", queue: "A", msgId: 3};
                routingKey = util.format(baseRoutingKey, message.queue, message.msgId);
                publishMessage(stompClient, message, queueNameSiteA, routingKey);

                // publish 2 messages for B
                message = {message: "msg1 for B", queue: "B", msgId: 4};
                routingKey = util.format(baseRoutingKey, message.queue, message.msgId);
                publishMessageWithTransaction(stompClient, message, queueNameSiteB, routingKey);

                message = {message: "msg2 for B", queue: "B", msgId: 5};
                routingKey = util.format(baseRoutingKey, message.queue, message.msgId);
                publishMessageWithTransaction(stompClient, message, queueNameSiteB, routingKey);

                // publish 1 message for C
                message = {message: "msg1 for C", queue: "C", msgId: 6};
                routingKey = util.format(baseRoutingKey, message.queue, message.msgId);
                publishMessageWithTransaction(stompClient, message, queueNameSiteC, routingKey);

                return callback(null, 'All messages have been published');
            }

        } catch (err) {
            var errMsg;
            if (err.stack) {
                errMsg = err.stack;
            } else if (err.message) {
                errMsg = err.message;
            } else {
                errMsg = err;
            }

            log.error('trapped the following error:' + errMsg);
            exit();
        }
    };

    var exit = function(){
        log.info('exiting program');
        process.nextTick(function () {
            process.exit(1);
        });
    };

    var processMessage = function(msg) {
        log.info(util.format('processMessage received', msg));
    };

    var listener = function(client, destination, selector, messageProcessorFunction){

        var subscribeArgs = {
            destination: destination,
            //selector: 'RoutingKey LIKE '%s',
            ack: 'auto'
        };

        client.on('message', function (messageData) {
            log.debug(util.format("listener.onMessage = %s", JSON.stringify(messageData)));

            var messageHeaders = messageData.headers;
            var deliveryInfo = {
                routingKey: messageHeaders.RoutingKey
            };
            var messageBody = messageData.body;
            messageBody = JSON.parse(messageBody);

            log.debug(util.format("listener started message with routing key %s = %s", deliveryInfo.routingKey, messageBody));

            process.nextTick(function () {
                messageProcessorFunction(messageBody, messageHeaders, deliveryInfo, function (err, handlerMsg) {
                    log.debug(util.format("listener finished message with routing key %s", deliveryInfo.routingKey));

                    if (err) {
                        var errMsg = util.format("listener handler returned error: %s", err.message);
                        log.error(errMsg);
                    } else {
                        log.debug(util.format("listener handler message returned: %s", handlerMsg));
                    }
                });
            });
        });

        log.info('listener listening to ' + subscribeArgs.destination);
        client.subscribe(subscribeArgs, function (body, headers) {
            log.debug(util.format("subscribe body: %s headers:%s", JSON.stringify(body), JSON.stringify(headers)));
        });
    };

    var publishMessage = function(client, message, queueName, routingKey) {
        var publisherArgs = {
            body: JSON.stringify(message),
            persistent: 'true'
        };
        if (routingKey) {
            publisherArgs.RoutingKey = routingKey;
        }
        publisherArgs.destination = queueName;

        var wantReceipt = false;
        client.send(publisherArgs, wantReceipt);

        log.info(util.format("publishMessage %s", JSON.stringify(publisherArgs)));
    };

    var publishMessageWithTransaction = function(client, message, queueName, routingKey) {

        var txn = client.begin();

        var publisherArgs = {
            body: JSON.stringify(message),
            persistent: 'true',
            transaction: txn
        };
        if (routingKey) {
            publisherArgs.RoutingKey = routingKey;
        }
        publisherArgs.destination = queueName;

        var wantReceipt = false;

        client.send(publisherArgs, wantReceipt);

        client.commit(txn);
        //client.abort(txn);

        log.info(util.format("publishMessageWithTransaction %s", JSON.stringify(publisherArgs)));
    };


    return {
        init: init,
        execute: execute,
        getParams: getParams
    };
}();

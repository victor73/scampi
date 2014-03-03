/**
 * @class Stomp
 * An instance of the Stomp object for interacting with STOMP messaging brokers
 *
 * @type {StompJS.Stomp}
 */
var Stomp = module.exports = function() {
    "use strict";

    var errMsgNotInitialized = "not initialized";
    var errMsgNotConnected = "not connected";

    var events = require('events');
    var Frame = require('./frame.js');

    var StompUtils = require('./stomp.utils.js');
    var stompUtils = new StompUtils();

    var net, tls, sys, log;

    var _initialized = false;
    var _connected = false;
    var options = {};
    var subscribedTo, session, socket, thisPointer;

    /**
     * @method Client
     *
     * Creates a client for the {@link StompJS.Stomp} object.
     *
     * @param {Object}     args    arguments needed to create the client
     *
     * ***Example:***
     *
     *      args = {
     *          port: 61613,
     *          host: 'localhost',
     *          debug: false,
     *          login: 'guest',
     *          passcode: 'guest'
     *      }
     *
     *      If debug is set to true, extra output will be printed to the console.
     *
     *      var client = new Stomp().Client(args);
     *
     * @returns {Object}                    returns StompClient
     */
    var Client = function(args) {
        net = require('net');
        tls = require('tls');
        sys = require('util');

        options.port = args.port || 61613;
        options.host = args.host || '127.0.0.1';
        options.login = args.login || null;
        options.passcode = args.passcode || null;
        options.ssl = args.ssl ? true : false;
        options.sslValidate = args.ssl_validate ? true : false;
        options.sslOptions = args.ssl_options || {};
        options.clientId = args['client-id'] || null;
        options.vhost = args.vhost || null;
        options.timeout = args.timeout || 120000;
        options.keepAlive = args.keepAlive || false;

        var debug = args.debug || false;
        var StompLogger = require('./stomp.logger.js');
        log = new StompLogger(debug);

        subscribedTo = {};
        session = null;
        socket = null;

        // Stomp is an EventEmitter
        stompUtils.extend(this, events.EventEmitter.prototype );

        // need to save ref to this object for emitWrapper
        // TODO: maybe use .call(this)
        thisPointer = this;

        _initialized = true;
        return this;
    };

    /**
     * Returns if the object has been initialized
     *
     * @returns {Boolean}            returns *true* if initialized; otherwise, *false*
     */
    var isInitialized = function() {
        return _initialized;
    };

    /**
     * Returns if the object has been connected
     *
     * @returns {Boolean}            returns *true* if connected; otherwise, *false*
     */
    var isConnected = function() {
        return _connected;
    };

    /**
     * Creates sockets used to connect to STOMP broker. Sets the connected flag to *true* upon completion.
     * Emits "connected" upon completion.
     *
     * @returns {void}
     */
    var connect = function() {
        if(!_initialized) {throw new Error(errMsgNotInitialized);}

        var host = options.host;
        var port = options.port;

        if (options.ssl) {
            log.debug('Connecting to ' + host + ':' + port + ' using SSL');

            socket = tls.connect(port, host, options.sslOptions, function() {
                log.debug('SSL connection complete');
                if (!socket.authorized) {
                    log.error('SSL is not authorized: '+ socket.authorizationError);
                    if (options.sslValidate) {
                        disconnect();
                        return;
                    }
                }

                socket.setTimeout(options.timeout);
                socket.setKeepAlive(options.keepAlive);

                setupListeners();
            });
        }
        else {
            log.debug('Connecting to ' + host + ':' + port);
            socket = new net.Socket();
            setupListeners();
            socket.setTimeout(options.timeout);
            socket.setKeepAlive(options.keepAlive);
            socket.connect(port, host);
        }
        _connected = true;
    };

    /**
     * Removes sockets used to connects STOMP broker.  Calls socket.end which emits an "end" event.  The 'on end' handler
     * calls disconnectFinish which destroys the socket
     *
     * @returns {void}
     */
    var disconnect = function() {
        if(!_initialized) {throw new Error(errMsgNotInitialized);}
        log.debug('ending socket');
        socket.end();
    };

    /**
     * Finishes the disconnect process (destroys socket). Broken into two phases since disconnect called socket.end which its handler called
     * disconnect...created an infinite loop
     *
     * Emits "disconnected" upon completion.
     *
     * @returns {void}
     */
    var disconnectFinish = function() {
        if(!_initialized) {throw new Error(errMsgNotInitialized);}

        if (socket.readyState === 'readOnly') {
            log.debug('destroying socket');
            socket.destroy();
        }

        log.debug('disconnected emitted');
        _connected = false;
        emitWrapper("disconnected");
    };

    /**
     * Subscribes to destination (queue or topic).
     * Emits "subscribed" upon completion.
     *
     * @param {Object}      headers     a header object
     * @param {Function}    callback    a function to call and pass it the message that is dequeued
     * @returns {void}
     */
    var subscribe = function(headers, callback) {
        if(!_initialized) {throw new Error(errMsgNotInitialized);}
        if(!_connected) {throw new Error(errMsgNotConnected);}

        var destination = headers.destination;
        headers.session = session;

        if (destination instanceof Array) {
            for (var i=0; i < destination.length; i++) {
                headers.destination = destination[i];
                sendCommand('SUBSCRIBE', headers);
                subscribedTo[destination[i]] = { enabled: true, callback: callback };
                log.debug('subscribed to: ' + destination[i] + ' with headers ' + sys.inspect(headers));
            }
        }
        else {
            sendCommand('SUBSCRIBE', headers);
            subscribedTo[destination] = { enabled: true, callback: callback };
            log.debug('subscribed to: ' + destination + ' with headers ' + sys.inspect(headers));
        }

        emitWrapper("subscribed", destination);
    };

    /**
     * Unsubscribes from destination (queue or topic).
     * Emits "unsubscribed" upon completion.
     *
     * @param {Object}      headers     a header object
     * @returns {void}
     */
    var unsubscribe = function(headers) {
        if(!_initialized) {throw new Error(errMsgNotInitialized);}
        if(!_connected) {throw new Error(errMsgNotConnected);}

        var destination = headers.destination;
        headers.session = session;

        if (destination instanceof Array) {
            for (var i=0; i < destination.length; i++) {
                headers.destination = destination[i];
                sendCommand('UNSUBSCRIBE', headers);
                subscribedTo[destination[i]].enabled = false;
                log.debug('no longer subscribed to: ' + destination[i]);
            }
        }
        else {
            sendCommand('UNSUBSCRIBE', headers);
            subscribedTo[destination].enabled = false;
            log.debug('no longer subscribed to: ' + destination);
        }

        emitWrapper("unsubscribed", destination);
    };

    /**
     * Sends a message to the STOMP broker.
     *
     * @param {Object}      headers         a header object
     * @param {Boolean}     wantReceipt     boolean to indicate that you wish to get a receipt (set receipt header)
     * @returns {Object}                    returns a `Frame` object representing the message sent
     */
    var send = function(headers, wantReceipt) {
        var body = headers.body || null;
        delete headers.body;
        headers.session = session;
        return sendCommand('SEND', headers, body, wantReceipt);
    };

    /**
     * Acknowledges a received message.
     *
     * @param {String}      messageId       the message id to ack
     * @returns {void}
     */
    var ack = function(messageId) {
        sendCommand('ACK', {'message-id': messageId});
        log.debug('acknowledged message: ' + messageId);
    };

    /**
     * Begins a transaction.
     *
     * @returns {String}    returns a string representing the generated transaction id
     */
    var begin = function() {
        var transactionId = Math.floor(Math.random()*99999999999).toString();
        sendCommand('BEGIN', {'transaction': transactionId});
        log.debug('begin transaction: ' + transactionId);
        return transactionId;
    };

    /**
     * Commits a transaction.
     *
     * @param {String}      transactionId       the transaction id from {@link Stomp#begin begin} to commit
     * @returns {void}
     */
    var commit = function(transactionId) {
        sendCommand('COMMIT', {'transaction': transactionId});
        log.debug('commit transaction: ' + transactionId);
    };

    /**
     * Aborts a transaction.
     *
     * @param {String}      transactionId       the transaction id from {@link Stomp#begin begin} to abort
     * @returns {void}
     */
    var abort = function(transactionId) {
        sendCommand('ABORT', {'transaction': transactionId});
        log.debug('abort transaction: ' + transactionId);
    };

    /**
     * @private
     *
     * Handles frame based on type.  Emits events when needed.
     * Emits "message" upon message processed
     * Emits "connected" upon connecting
     * Emits "receipt" upon message receipt
     * Emits "error" upon errors
     *
     * @param {String}      frame       the frame to handle
     * @returns {void}
     */
    var handleNewFrame = function(frame) {
        switch (frame.command) {
            case "MESSAGE":
                if (isMessage(frame)) {
                    shouldRunMessageCallback(frame);
                    emitWrapper('message', frame);
                }
                break;
            case "CONNECTED":
                log.debug('Connected to STOMP');
                session = frame.headers.session;
                emitWrapper('connected');
                break;
            case "RECEIPT":
                emitWrapper('receipt', frame.headers['receipt-id']);
                break;
            case "ERROR":
                emitWrapper('error', frame);
                break;
            default:
                log.debug("Could not parse command: " + frame.command);
        }
    };

    /**
     * @private
     *
     * Sets up the listeners for the socket events
     * Emits "error" upon errors
     * Emits "disconnected" upon socket close
     *
     * @param {String}      frame       the frame to handle
     * @returns {void}
     */
    var setupListeners = function() {

        socket.on('drain', function(data) {
            log.debug('on drain');
        });

        var buffer = '';
        socket.on('data', function(chunk) {
            log.debug('on data');
            buffer += chunk;
            var frames = buffer.split('\0\n');

            // Temporary fix : NULL,LF is not a guaranteed standard, the LF is optional, so lets deal with it.  (Rauls)
            if (frames.length === 1) {
                frames = buffer.split('\0');
            }

            if (frames.length === 1) {return;}
            buffer = frames.pop();

            var pFrame = null;
            var moreFrames = true;
            while (moreFrames) {
                var frame = frames.shift();
                if (!frame) {
                    moreFrames = false;
                } else {
                    pFrame = parseFrame(frame);
                    handleNewFrame(pFrame);
                }
            }
        });

        socket.on('timeout', function() {
            log.debug("on timeout");
            disconnect();
        });


        socket.on('end', function() {
            log.debug("on end");
            disconnectFinish();
        });

        socket.on('error', function(error) {
            log.debug('on error');
            log.error(error.stack + 'error name: ' + error.name);
            emitWrapper("error", error);
        });

        socket.on('close', function(error) {
            log.debug('on close');
            if (error) {
                log.error('Closed with error: ' + error);
            }
            log.debug('closed emitted');
            emitWrapper("closed", error);
        });

        if (options.ssl) {
            stompConnect();
        } else {
            socket.on('connect', stompConnect);
        }
    };

    /**
     * @private
     *
     * Preps for and starts the STOMP connection
     *
     * @returns {void}
     */
    var stompConnect = function() {
        log.debug('Connected to socket');
        var headers = buildHeaders(options);

        var args = {};

        headers = headers || {};

        args.command = 'CONNECT';
        args.headers = headers;

        var frame = new Frame();
        var newFrame = frame.buildFrame(args);

        sendFrame(newFrame);
    };

    /**
     * @private
     *
     * Wrapper to emit the events for the STOMP object
     *
     * @returns {void}
     */
    var emitWrapper = function(str, obj){
        thisPointer.emit(str, obj);
    };

    /**
     * @private
     *
     * Returns the process args/options passed into the Client.
     * This is only used for testing purposes which is why this public function is marked private.
     *
     * @returns {Object}        returns the process args/options passed into the Client
     */
    var getOptions = function(){
        return options;
    };

    /**
     * @private
     *
     * Helper to parse the command from frame
     *
     * @param {Object}      data       the frame as a buffer
     * @returns {String}               returns the command from the frame
     */
    var parseCommand = function(data) {
        var dataStr = data.toString('utf8', 0, data.length);
        var command = dataStr.split('\n');
        return command[0];
    };

    /**
     * @private
     *
     * Helper to parse the headers from frame
     *
     * @param {Object}      rawHeaders       the raw headers from the frame
     * @returns {Object}                     returns the headers from the frame
     */
    var parseHeaders = function(rawHeaders) {
        log.debug('rawHeaders',rawHeaders);
        var headers = {};
        var headersSplit = rawHeaders.split('\n');

        for (var i = 0; i < headersSplit.length; i++) {
            var header = headersSplit[i].split(':');
            if (header.length > 1) {
                var headerKey = header.shift().trim();
                var headerVal = header.join(':').trim();
                headers[headerKey] = headerVal;
                continue;
            }

            var header0 = header[0];
            var header1 = header[1];
            if (header0) {
                header0 = header0.trim();
            }
            if (header1) {
                header1 = header1.trim();
            }
            headers[header0] = header1;
        }
        return headers;
    };

    /**
     * @private
     *
     * Helper to parse the key data pieces (headers, command, body) from frame
     *
     * @param {Object}      chunk       the frame as a buffer
     * @returns {Object}                returns the frame as a [StompJS.Frame](#!/api/Frame)
     */
    var parseFrame = function(chunk) {
        if (!stompUtils.isDefined(chunk)) {
            return null;
        }

        var command = parseCommand(chunk);
        var data = chunk.slice(command.length + 1, chunk.length);
        data = data.toString('utf8', 0, data.length);

        var theRest = data.split('\n\n');
        var headers = parseHeaders(theRest[0]);
        var body = theRest.slice(1, theRest.length);

        if ('content-length' in headers) {
            headers.bytes_message = true;
        }

        var args = {
            command: command,
            headers: headers,
            body: body
        };

        var frame = new Frame();
        var newFrame = frame.buildFrame(args);

        return newFrame;
    };

    /**
     * @private
     *
     * Helper to build the headers from the client args/options
     *
     * @param {Object}      options     the client args/options
     * @returns {Object}                returns the headers
     */
    var buildHeaders = function(options) {
        var headers = {};
        if (stompUtils.isDefined(options.login) &&
            stompUtils.isDefined(options.passcode)) {
            headers.login = options.login;
            headers.passcode = options.passcode;
        }
        if (stompUtils.isDefined(options.clientId)) {
            headers["client-id"] = options.clientId;
        }
        if (stompUtils.isDefined(options.vhost)) {
            headers.host = options.vhost;
        }
        return headers;
    };

    /**
     * @private
     *
     * Create the STOMP Frame and send the command to the STOMP broker
     *
     * @param {String}      command         the command to send
     * @param {Object}      headers         the headers to send
     * @param {Object}      body            the body to send
     * @param {Boolean}     wantReceipt     boolean to indicate that you wish to get a receipt
     * @returns {Object}                    returns a [StompJS.Frame](#!/api/Frame)
     */
    var sendCommand = function(command, headers, body, wantReceipt) {
        if (!stompUtils.isDefined(wantReceipt)) {
            wantReceipt = false;
        }

        if (!stompUtils.isDefined(headers)) {
            headers = {};
        }

        var args = {
            'command': command,
            'headers': headers,
            'body': body
        };

        var frame = new Frame();
        var newFrame = frame.buildFrame(args, wantReceipt);
        sendFrame(newFrame);

        return newFrame;
    };

    /**
     * @private
     *
     * Sends the STOMP frame to the message broker
     *
     * @param {String}      frame           the [StompJS.Frame](#!/api/Frame)
     * @returns {void}
     */
    var sendFrame = function(frame) {
        var frameStr = frame.asString();

        if (frame) {
            if (frame.headers) {
                if (frame.headers.login) {
                    log.debug('attempting to login with: ' + frame.headers.login);
                    //log.debug('login passcode: ' + frame.headers.passcode);  //TODO remove this
                }
            }
        }

        if (socket.write(frameStr) === false) {
            log.debug('Write buffered');
        }
    };

    /**
     * @private
     *
     * Determines if the frame headers have a message id which is assigned only if its a message
     *
     * @param {String}      frame           the [StompJS.Frame](#!/api/Frame)
     * @returns {Boolean}                   return *true* if the frame is a message; otherwise, *false*
     */
    var isMessage = function(frame) {
        return (frame.headers !== null && stompUtils.isDefined(frame.headers['message-id']));
    };

    /**
     * @private
     *
     * Determines if the message callback function should be ran and runs it if it should
     *
     * @param {String}      frame           the [StompJS.Frame](#!/api/Frame)
     * @returns {Boolean}                   return *true* if the frame is a message; otherwise, *false*
     */
    var shouldRunMessageCallback = function(frame) {
        var subscription = subscribedTo[frame.headers.destination];
        if (frame.headers.destination !== null && subscription !== null) {
            if (subscription.enabled && subscription.callback !== null && typeof(subscription.callback) === 'function') {
                subscription.callback(frame.body, frame.headers);
            }
        }
    };

    return {
        Client: Client,

        isInitialized: isInitialized,
        isConnected: isConnected,
        connect: connect,
        disconnect: disconnect,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        send: send,
        ack: ack,
        abort: abort,
        commit: commit,
        begin: begin,
        emitWrapper: emitWrapper,

        // exposed for testing purposes only
        getOptions: getOptions
    };
};

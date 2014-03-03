/**
 * @class Frame
 * The `Frame` module provides an object representation of a [STOMP frame](http://stomp.github.io/stomp-specification-1.0.html)
 *
 * @type {StompJS.Frame}
 */
var Frame = module.exports = function() {
    "use strict";
    this.command = null;
    this.headers = null;
    this.body = null;

    /**
     * Build frame based on arguments provided
     *
     * @param {Object}      args            arguments object needed to build frame (command, headers, body?)
     *
     * ***Example:***
     *
     *      args = {
     *          command: '',
     *          headers: {},
     *          body: ''
     *      }
     *
     * @param {Boolean}     wantReceipt     boolean to indicate that you wish to get a receipt (set receipt header)
     * @returns {Object}                    returns {@link StompJS.Frame}
     */
    var buildFrame = function(args, wantReceipt) {
        var receiptStamp = null;

        this.command = args.command;
        this.headers = args.headers;
        this.body = args.body;

        if (wantReceipt) {
            var receipt = '';
            receiptStamp = Math.floor(Math.random()*99999999999).toString();
            if (this.headers.session !== undefined) {
                receipt = receiptStamp + "-" + this.headers.session;
            }
            else {
                receipt = receiptStamp;
            }
            this.headers.receipt = receipt;
        }

        return this;
    };

    /**
     * String representation of Frame object
     *
     * @returns {String}                    returns {@link StompJS.Frame} as string
     */
    var asString = function() {
        var headerStrs = [],
            frame = "",
            command = this.command,
            headers = this.headers,
            body = this.body;

        for (var header in headers) {
            if (headers.hasOwnProperty(header)){
                headerStrs.push(header + ':' + headers[header]);
            }
        }

        frame += command + "\n";
        frame += headerStrs.join("\n");
        frame += "\n\n";

        if(body) {
            frame += body;
        }

        frame += '\x00';

        return frame;
    };

    return {
        buildFrame: buildFrame,
        asString: asString
    };
};

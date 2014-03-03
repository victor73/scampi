/**
 * @class StompLogger
 * An instance of the StompJS logger
 *
 * @type {StompJS.Logger}
 */
var StompLogger = module.exports = function(outputDebugInit) {
    "use strict";

    var outputDebug = outputDebugInit;

    /**
     * Writes a debug message to the console only if the outputDebug flag was also set to true
     *
     * @param {String}     message     the message to write to the console
     * @returns {void}
     */
    var debug = function(message) {
        if (outputDebug) {
            console.log("debug: " + message);
        }
    };

    /**
     * Writes a info message to the console
     *
     * @param {String}     message     the message to write to the console
     * @returns {void}
     */
    var info = function(message) {
        console.log("info: " + message);
    };

    /**
     * Writes a warn message to the console
     *
     * @param {String}     message     the message to write to the console
     * @returns {void}
     */
    var warn = function(message) {
        console.log("warn: " + message);
    };

    /**
     * Writes a error message to the console and kills the process based on die input
     *
     * @param {String}     message     the message to write to the console
     * @param {Boolean}     die        if *true*, then kill the process after writing the message
     * @returns {void}
     */
    var error = function(message, die) {
        console.log("error: " + message);
        if (die) {
            process.exit(1);
        }
    };

    /**
     * Writes a error message to the console and then kills the process
     *
     * @param {String}     message     the message to write to the console
     * @returns {void}
     */
    var die = function(message) {
        error(message, true);
    };

    return {
        debug: debug,
        info: info,
        warn: warn,
        error: error,
        die: die
    };
};

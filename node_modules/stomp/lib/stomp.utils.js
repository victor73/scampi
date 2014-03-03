/**
 * @class StompUtils
 * An instance of the StompJS helper utilities
 *
 * @type {StompJS.StompUtils}
 */
var StompUtils = module.exports = function() {
    "use strict";

    /**
     * Returns if the input is defined (not null or undefined)
     *
     * @param {Object}  varToTest   the variable to test
     * @returns {Boolean}           returns *true* if the input is defined; otherwise, *false*
     */
    var isDefined = function(varToTest) {
        return !(varToTest === null || typeof varToTest === "undefined");
    };

    /**
     * Extends the destination by adding any source properties
     *
     * @param {Object}      destination     the object to extend
     * @param {Object}      source          the object to extend from
     * @returns {Object}                    returns the extended object
     */
    var extend = function(destination, source) {
        if (!isDefined(destination)) {return destination;}
        if (!isDefined(source)) {return destination;}
        for (var property in source) {
            if (source.hasOwnProperty(property)) {
                destination[property] = source[property];
            }
        }
        return destination;
    };

    return {
        isDefined: isDefined,
        extend: extend
    };
};

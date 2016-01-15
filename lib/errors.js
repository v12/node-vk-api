'use strict';

/**
 * Custom errors used within module. All of the errors are exposed on the VK
 * object and the VK constructor as well.
 *
 * @module vkDirtyAPI/Errors
 */

const util = require('util');

/**
 * VK API error
 *
 * @param {Number} error_code Error code as returned by API
 * @param {String} error_msg Error message as returned by API
 *
 * @extends Error
 * @constructor
 */
const VKAPIError = function (error_code, error_msg) {
    Error.apply(this, arguments);

    /**
     * VK API error code
     */
    this.error_code = error_code;
    /**
     * VK API error message
     */
    this.error_msg = error_msg;

    if (Error.captureStackTrace)
        Error.captureStackTrace(this, this.constructor);
};
util.inherits(VKAPIError, Error);

/**
 * VK authentication error
 *
 * Returned in case if VK returned an error for sign in attempt
 *
 * @extends Error
 * @constructor
 */
const VKAuthError = function () {
    Error.apply(this, arguments);

    if (Error.captureStackTrace)
        Error.captureStackTrace(this, this.constructor);
};
util.inherits(VKAuthError, Error);


module.exports = {
    /**
     * @see VKAuthError
     */
    VKAuthError,
    /**
     * @see VKAPIError
     */
    VKAPIError
};
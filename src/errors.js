'use strict'

/**
 * Custom errors used within module. All of the errors are exposed on the VK
 * object and the VK constructor as well.
 *
 * @module vkDirtyAPI/Errors
 */

const util = require('util')

/**
 * VK API error
 *
 * @param {Number} code Error code as returned by API
 * @param {String} message Error message as returned by API
 *
 * @extends Error
 * @constructor
 */
const VKAPIError = function (code, message) {
  if (!(this instanceof VKAPIError)) {
    return new VKAPIError(code, message)
  }

  /**
   * VK API error code
   */
  this.error_code = code
  /**
   * VK API error message
   */
  this.error_msg = message

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  }
}
util.inherits(VKAPIError, Error)

/**
 * VK authentication error
 *
 * Returned in case if VK returned an error for sign in attempt
 *
 * @extends Error
 * @constructor
 */
const VKAuthError = function () {
  if (!(this instanceof VKAuthError)) {
    return new VKAuthError()
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  }
}
util.inherits(VKAuthError, Error)

module.exports = {
  /**
   * @see VKAuthError
   */
  VKAuthError,
  /**
   * @see VKAPIError
   */
  VKAPIError
}

'use strict';

/**
 * HTML parsing functions
 *
 * @module vk-dirty-api/Parsers
 */

var cheerio = require('cheerio'),
    errors  = require('./errors');

/**
 * @typedef {Object} FormDetails
 *
 * @property {String} url
 * @property {Object} fields
 */

/**
 * Parse HTML and return login form action URL and fields
 *
 * @param {!String} html
 * @returns {FormDetails}
 */
module.exports.parseLoginFormFields = function (html) {
    var $      = cheerio.load(html),
        fields = {};

    var form = $('form[method="post"][action]');

    form.find('input[name]').each(function () {
        var e = $(this);

        fields[ e.attr('name') ] = e.val();
    });

    return {
        url:    form.attr('action'),
        fields: fields
    };
};

/**
 * @callback allowButtonCallback
 * @param {?Error} error
 * @param {String} [url]
 */
/**
 * Parse HTML and return 'Allow' button link
 *
 * @param {!String} html
 * @param {!allowButtonCallback} cb
 */
module.exports.parseAllowButtonHref = function (html, cb) {
    var $ = cheerio.load(html);

    var err = $('.service_msg_warning');
    if (err.length !== 0)
        return cb(new errors.VKAuthError(err.text()));

    var form = $('form[method="post"][action]');
    if (form.length === 0)
        return cb(new Error('Unable to get link to grant permissions'));

    cb(null, form.attr('action'));
};
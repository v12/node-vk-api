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

/**
 * Parse HTML and return security check form action URL and fields
 *
 * @param {!String} html
 * @param {!String} phone
 * @returns {FormDetails}
 */
module.exports.securityCheckForm = function (html, phone) {
    if (!phone)
        throw new Error('Phone number should be provided when security check is requested');

    var $      = cheerio.load(html),
        fields = {};

    var form = $('form[method="post"][action]');

    form.find('input[name]').each(function () {
        var e = $(this);

        fields[ e.attr('name') ] = e.val();
    });

    var codeField = form.find('input[name="code"]');

    fields[ 'code' ] = module.exports._trimPhone(phone);

    var prefix  = module.exports._trimPhone(codeField.prev().text()),
        postfix = codeField.next().text().trim();

    if (fields[ 'code' ].indexOf(prefix) === 0)
        fields[ 'code' ] = fields[ 'code' ].slice(prefix.length);

    var i = fields[ 'code' ].lastIndexOf(postfix);
    if (i === fields[ 'code' ].length - postfix.length)
        fields[ 'code' ] = fields[ 'code' ].slice(0, i);

    return {
        url:    form.attr('action'),
        fields: fields
    };
};

module.exports._trimPhone = function (str) {
    return str.trim().replace(/^(\+|00)/, '');
};
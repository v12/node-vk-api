'use strict'

/**
 * HTML parsing functions
 *
 * @module vkDirtyAPI/Parsers
 */

const cheerio = require('cheerio')
const errors = require('./errors')

/**
 * @typedef {Object} FormDetails
 *
 * @property {String} url   Action URL to which form data should be sent
 * @property {Object} fields Form fields
 */

/**
 * Parse HTML and return login form action URL and fields
 *
 * @param {!String} html
 * @returns {Promise}
 */
module.exports.parseLoginForm = function (html) {
  return new Promise(function (resolve) {
    const $ = cheerio.load(html)
    const form = $('form[method="post"][action]')

    const fields = {}

    form.find('input[name]').each(function () {
      const e = $(this)

      fields[e.attr('name')] = e.val()
    })

    resolve({ fields, url: form.attr('action') })
  })
}

/**
 * Parse HTML and return 'Allow' button link
 *
 * @param {!String} html
 * @return {Promise}
 */
module.exports.parseAllowButtonHref = function (html) {
  return new Promise(function (resolve, reject) {
    const $ = cheerio.load(html)
    const form = $('form[method="post"][action]')

    if (form.length === 0) {
      return reject(new Error('Unable to get link to grant permissions'))
    }

    resolve(form.attr('action'))
  })
}

/**
 * Parse HTML and return security check form action URL and fields
 *
 * @param {!String} html
 * @param {!String} phone
 * @returns {Promise}
 */
module.exports.securityCheckForm = function (html, phone) {
  return new Promise(function (resolve, reject) {
    if (!phone) {
      return reject(new Error('Phone number should be provided when security check is requested'))
    }

    const $ = cheerio.load(html)
    const form = $('form[method="post"][action]')

    const fields = {}

    form.find('input[name]').each(function () {
      const e = $(this)

      fields[e.attr('name')] = e.val()
    })

    const codeField = form.find('input[name="code"]')

    fields['code'] = module.exports._trimPhone(phone)

    const prefix = module.exports._trimPhone(codeField.prev('.field_prefix').text())
    const postfix = codeField.next('.field_prefix').text().trim()

    if (fields['code'].indexOf(prefix) === 0) {
      fields['code'] = fields['code'].slice(prefix.length)
    }

    const i = fields['code'].lastIndexOf(postfix)
    if (i === fields['code'].length - postfix.length) {
      fields['code'] = fields['code'].slice(0, i)
    }

    resolve({ fields, url: form.attr('action') })
  })
}

module.exports._trimPhone = str => str.trim().replace(/^(\+|00)/, '')

/**
 * Check if login was successful, otherwise return VKAuthError with an error message
 *
 * @param r
 */
module.exports.checkForError = function (r) {
  return new Promise(function (resolve, reject) {
    const $ = cheerio.load(r.body)
    const err = $('.service_msg_warning')

    if (err.length !== 0) {
      return reject(new errors.VKAuthError(err.text()))
    }

    resolve(r)
  })
}

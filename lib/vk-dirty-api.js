'use strict';

/**
 * @module vkDirtyAPI
 */

const request       = require('request-promise'),
      extend        = require('xtend'),
      isPlainObject = require('is-plain-object'),
      joi           = require('joi'),
      errors        = require('./errors'),
      parsers       = require('./parsers');

const phoneRegexp = /^\+?[\d]+$/;

const paramsSchema = joi.object({
        client_id:    joi.number().positive().integer(),
        login:        [ joi.string().min(3), joi.number().integer() ],
        pass:         joi.string(),
        phone:        joi.string().regex(phoneRegexp)
                          .when('login', {
                              is:        joi.string().regex(phoneRegexp),
                              otherwise: joi.required()
                          }),
        scope:        joi.array().items(joi.string()).unique().default([ 'offline' ]),
        tokenStorage: joi.object({
            getToken: joi.func(),
            setToken: joi.func()
        }).unknown()
    })
    .unknown()
    .requiredKeys('client_id', 'login', 'pass');

/**
 * This is the main class, the entry point to vk-dirty-api. To use it, you just need to import vk-dirty-api:
 *
 * ```js
 * var VK = require('vk-dirty-api');
 * ```
 */

/**
 * Instantiate vk-dirty-api with options object
 *
 * @name token
 *
 * @param {!Object}  options
 * @param {!Number}  options.client_id VK application ID
 * @param {!String}  options.login User login
 * @param {!String} [options.phone] Phone number used for account (optional if login is phone number already)
 * @param {!String}  options.pass  User password
 * @param {String[]} [options.scope] Application scope
 * @param {Object} [options.tokenStorage] Token storage
 * @param {Function} [cb] A function that is called when authorization flow has finished
 *
 * @returns {Promise}
 */
/**
 * Instantiate vk-dirty-api with application ID, username and password
 *
 * @name token
 *
 * @param {!Number}  client_id VK application ID
 * @param {!String}  login User login
 * @param {!String}  pass  User password
 *
 * @returns {Promise}
 */
function token (client_id, login, pass) {
    let params;

    if (isPlainObject(client_id)) {
        params = client_id;
    } else
        params = {
            client_id: +client_id,
            login:     login,
            pass:      pass
        };

    try {
        params = joi.attempt(params, paramsSchema, 'Invalid parameter');
    } catch (e) {
        return Promise.reject(e);
    }

    const req = request.defaults({
        jar:                     request.jar(),
        headers:                 {
            'User-Agent': 'nodejs-vk-api/' + require('../package.json').version
        },
        followAllRedirects:      true,
        resolveWithFullResponse: true
    });

    function getToken () {
        return req('https://oauth.vk.com/authorize', {
            qs: {
                client_id:     params.client_id,
                scope:         params.scope.join(','),
                redirect_uri:  'https://oauth.vk.com/blank.html',
                display:       'mobile',
                v:             '5.21',
                response_type: 'token'
            }
        })
            .then(r => parsers.parseLoginForm(r.body))
            .then(function (form) {
                if (!form.fields.hasOwnProperty('email'))
                    throw new Error('Unable to fetch login page');

                form.fields.email = params.login;
                form.fields.pass  = params.pass;

                return form;
            })
            .then(d => req.post(d.url, { form: d.fields }))
            .then(parsers.checkForError)
            .then(function (r) { // handle security check
                if (/act=security_check/.test(r.request.href))
                    return parsers.securityCheckForm(r.body, params.phone || params.login)
                        .then(function (d) {
                            if (d.url[ 0 ] === '/' && d.url[ 1 ] !== '/')
                                d.url = 'https://' + r.request.uri.host + d.url;

                            return req.post(d.url, { form: d.fields });
                        });

                return r;
            })
            .then(function (r) {
                // check if user hasn't already granted access
                if (!/access_token=([a-f0-9]+)/.test(r.request.uri.hash))
                    return parsers.parseAllowButtonHref(r.body).then(link => req.post(link));

                return r;
            })
            .then(function (r) {
                const access_token = /access_token=([a-f0-9]+)/.exec(r.request.uri.hash);

                if (!access_token[ 1 ])
                    throw new Error('Invalid access_token');

                return access_token[ 1 ];
            })
            .then(function (token) {
                if (params.tokenStorage)
                    return params.tokenStorage.setToken(token)
                        .then(() => token);

                return token;
            });
    }

    // Getting token, if cache is set, then get token from storage
    if (params.tokenStorage)
        return params.tokenStorage.getToken().then(token => !token ? getToken() : token);

    return getToken();
}

/**
 * @param {!String} access_token
 * @param {String} [version='5.21']
 * @returns {Function} apiRequest
 */
function api (access_token, version) {
    /**
     * Make a query to the VK API
     *
     * @name apiRequest
     *
     * @param {String}             method VK API method to be called
     * @param {Object}             [params] Query parameters
     *
     * @returns {Promise}
     */
    return (method, params) => request.get('https://api.vk.com/method/' + method, {
            qs:                      extend(params, { v: version || '5.21', access_token }),
            json:                    true,
            resolveWithFullResponse: true
        })
        .then(function (r) {
            if (r.body.hasOwnProperty('error'))
                throw new errors.VKAPIError(r.body.error.error_code, r.body.error.error_msg);

            if (!r.body.hasOwnProperty('response'))
                throw new Error('No `response` field in API response');

            return r.body.response;
        });
}

module.exports = Object.freeze({
    /**
     * Request token
     */
                  token,
    /**
     * Get API request helper
     */
                  api,
    /**
     * @link {module:vkDirtyAPI/Errors.VKAuthError}
     */
    VKAuthError:  errors.VKAuthError,
    /**
     * @link {module:vkDirtyAPI/Errors.VKAPIError}
     */
    VKAPIError:   errors.VKAPIError,
    TokenStorage: require('../token-storage')
});
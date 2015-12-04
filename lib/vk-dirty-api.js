'use strict';

/**
 *
 * @module vk-dirty-api
 */

var request      = require('request'),
    async        = require('async'),
    extend       = require('xtend'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    errors       = require('./errors'),
    parsers      = require('./parsers');

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
 * @name VK
 * @constructor
 *
 * @param {!Object}   options
 * @param {!Number}   options.appId VK application ID
 * @param {!String}   options.login User login
 * @param {!String}   options.pass  User password
 * @param {Function} [cb] A function that is called when authorization flow has finished
 */
/**
 * Instantiate vk-dirty-api with application ID, username and password
 *
 * @name VK
 * @constructor
 *
 * @param {!Number}   appId VK application ID
 * @param {!String}   login User login
 * @param {!String}   pass  User password
 * @param {Function} [cb] A function that is called when authorization flow has finished
 */
var VK = function (appId, login, pass, cb) {
    var cookieJar = request.jar();

    var self = this;

    /**
     * Effective `access_token` is stored in this property
     * @property access_token
     */
    self.access_token = false;

    var req = request.defaults({
        jar:                cookieJar,
        headers:            {
            'User-Agent': 'nodejs-vk-api/' + require('../package.json').version
        },
        followAllRedirects: true
    });

    var default_params = {
        client_id: 0,
        login:     '',
        pass:      '',
        scope:     [
            'notify',
            'friends',
            'photos',
            'audio',
            'video',
            'docs',
            'notes',
            'pages',
            'status',
            'offers',
            'questions',
            'wall',
            'groups',
            'messages',
            'notifications',
            'stats',
            'ads',
            'offline'
        ]
    };

    var params;
    if (typeof appId === 'object') {
        params = extend(default_params, appId);
        cb     = login;
        pass   = params.pass;
        login  = params.login;
        appId  = +params.client_id;
    } else
        params = extend(default_params, {
            client_id: +appId,
            login:     login,
            pass:      pass
        });

    if (params.hasOwnProperty('cacheToken'))
        self.cacheToken = params.cacheToken;

    // in case if only EventEmitter is used
    if (typeof cb !== 'function')
        cb = function () {};

    var errorCallback = function (err) {
        process.nextTick(() => self.emit('error', err));

        typeof cb !== 'function' && cb(err);
    };

    var e;
    if (isNaN(appId))
        e = new TypeError('Invalid client_id');
    else if (typeof login !== 'string')
        e = new TypeError('Login should be a string');
    else if (login.length === 0)
        e = new Error('Login is not defined');
    else if (typeof pass !== 'string')
        e = new TypeError('Password should be a string');
    else if (pass.length === 0)
        e = new Error('Password is not defined');

    if (e) {
        errorCallback(e);
        return self;
    } else {
        var getToken = function () {
            async.waterfall([
                async.apply(req, 'https://oauth.vk.com/authorize', {
                    qs: {
                        client_id:     params.client_id,
                        scope:         params.scope.join(','),
                        redirect_uri:  'https://oauth.vk.com/blank.html',
                        display:       'mobile',
                        v:             '5.21',
                        response_type: 'token'
                    }
                }),
                function (r, body, cb) {
                    var nextQuery = parsers.parseLoginFormFields(body);

                    if (!('email' in nextQuery.form))
                        return cb(new Error('Unable to fetch login page'));

                    nextQuery.form.email = params.login;
                    nextQuery.form.pass  = params.pass;

                    cb(null, nextQuery);
                },
                (d, cb) => req.post(d.url, { form: d.form }, cb),
                (r, body, cb) => parsers.parseAllowButtonHref(body, cb),
                (link, cb) => req.post(link, (e, res) => cb(e, res)),
                function (res, cb) {
                    var access_token = /access_token=([a-f0-9]+)/.exec(res.request.uri.hash);

                    if (!access_token[ 1 ])
                        return cb(new Error('Invalid access_token'));

                    self.access_token = access_token[ 1 ];

                    // Cache token
                    if (self.cacheToken)
                        self.cacheToken.setToken(self.access_token, err => cb(null, self.access_token));
                    else
                        cb(null, self.access_token);
                }
            ], function (err, access_token) {
                if (err)
                    return errorCallback(err);

                process.nextTick(() => self.emit('auth', access_token));

                cb(null, access_token);
            });
        };

        // Getting token, if cache is set, then get token from storage
        if (self.cacheToken)
            self.cacheToken.getToken(function (err, token) {
                if (!err) {
                    self.access_token = token;

                    process.nextTick(() => self.emit('auth', token));

                    cb(null, token);
                } else
                    getToken();

            });
        else
            getToken();
    }

    return self;
};
util.inherits(VK, EventEmitter);

/**
 * API request callback
 *
 * @callback apiRequestCallback
 * @param {?Error} error
 * @param {Object} [result]
 */

/**
 * Make a query to the VK API
 *
 * @param {String}             method VK API method to be called
 * @param {Object}             [params] Query parameters
 * @param {apiRequestCallback} cb
 *
 * @returns {VK}
 */
VK.prototype.api = function (method, params, cb) {
    var _cb, _params;
    if (typeof params === 'function') {
        _cb     = params;
        _params = {};
    } else _cb = cb;

    request.get('https://api.vk.com/method/' + method, {
        qs:   extend(_params, {
            v:            '5.21',
            access_token: this.access_token
        }),
        json: true
    }, function (err, r, json) {
        if (err)
            return _cb(err);

        if (json.hasOwnProperty('error'))
            return _cb(new errors.VKAPIError(json.error.error_code, json.error.error_msg));

        if (!json.hasOwnProperty('response'))
            return _cb(new Error('No `response` field in API response'));

        _cb(null, json.response);
    });

    return this;
};

/**
 * A reference to VK constructor from vk. Useful for accessing Errors.
 * @property VK
 * @see {VK}
 */
VK.prototype.VK = VK;

/**
 * @link {module:vk-dirty-api/Errors.VKAuthError}
 */
VK.prototype.VKAuthError = VK.VKAuthError = errors.VKAuthError;

/**
 * @link {module:vk-dirty-api/Errors.VKAPIError}
 */
VK.prototype.VKAPIError = VK.VKAPIError = errors.VKAPIError;

module.exports = VK;
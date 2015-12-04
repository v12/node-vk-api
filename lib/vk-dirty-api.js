var request      = require('request'),
    cheerio      = require('cheerio'),
    async        = require('async'),
    url          = require('url'),
    extend       = require('xtend'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter;

function authorize (appId, login, pass, cb) {
    var cookieJar = request.jar();

    var self = this;

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
                async.apply(req, url.format({
                    protocol: 'https',
                    host:     'oauth.vk.com',
                    pathname: 'authorize',
                    query:    {
                        client_id:     params.client_id,
                        scope:         params.scope.join(','),
                        redirect_uri:  'https://oauth.vk.com/blank.html',
                        display:       'mobile',
                        v:             '5.21',
                        response_type: 'token'
                    }
                })),
                function (r, body, cb) {
                    var nextQuery = getLoginFormData(body);

                    if (!('email' in nextQuery.form))
                        return cb(new Error('Unable to fetch login page'));

                    nextQuery.form.email = params.login;
                    nextQuery.form.pass  = params.pass;

                    cb(null, nextQuery);
                },
                (d, cb) => req.post(d.url, { form: d.form }, cb),
                (r, body, cb) => getAllowLink(body, cb),
                (link, cb) => req.post(link, cb),
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

                    process.nextTick(() => self.emit('auth', self.access_token));

                    cb(null, token);
                } else
                    getToken();

            });
        else
            getToken();
    }

    function getLoginFormData (html) {
        var $        = cheerio.load(html),
            formData = {};

        var form   = $('form[method="post"][action]'),
            inputs = form.find('input[name]');

        inputs.each(function () {
            var e = $(this);

            formData[ e.attr('name') ] = e.val();
        });

        return {
            url:  form.attr('action'),
            form: formData
        };
    }

    function getAllowLink (html, cb) {
        var $ = cheerio.load(html);

        var err = $('.service_msg_warning');
        if (err.length !== 0)
            return cb(new Error('VK error: ' + err.text()));

        var form = $('form[method="post"][action]');
        if (form.length === 0)
            return cb(new Error('Unable to get link to grant permissions'));

        cb(null, form.attr('action'));
    }

    self.api = function api (method, options, cb) {
        if (typeof options === 'function') {
            cb      = options;
            options = {};
        }

        request({
            url: 'https://api.vk.com/method/' + method,
            qs:  extend(options, {
                v:            '5.21',
                access_token: self.access_token
            }),
            json: true
        }, function (err, r, response) {
            if (err)
                return cb(err);

            if ('error' in response) {
                var e  = new Error(response.error.error_msg);
                e.code = response.error.error_code;
                return cb(e);
            }

            if (!('response' in response))
                return cb(new Error('No `response` field in API response'));

            cb(null, response.response);
        });

        return this;
    };

    return self;
}

util.inherits(authorize, EventEmitter);
module.exports = exports = authorize;
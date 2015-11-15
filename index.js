var request = require('request'),
    cheerio = require('cheerio'),
    url = require('url'),
    extend = require('xtend'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;
    
function authorize(appId, login, pass, cb) {
    var cookieJar = request.jar();

    var self = this;
    self.access_token = false;

    request = request.defaults({
        jar:                cookieJar,
        headers:            {
            'User-Agent': 'nodejs-vk-api/1.0'
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
        cb = login;
        pass = params.pass;
        login = params.login;
        appId = params.client_id;
    }
    else {
        params = extend(default_params, {
            client_id: appId,
            login:     login,
            pass:      pass
        });
    }

    if (params.hasOwnProperty('cacheToken')) {
        this.cacheToken = params.cacheToken;
    }

    // in case if only EventEmitter is used
    if (typeof cb !== 'function')
        cb = function () {};

    var errorCallback = function (err) {
        self.emit('error', err);
        typeof cb !== 'function' && cb(err);
    };

    var e;
    if (parseInt(appId) <= 0)
        e = new Error('Invalid client_id');
    else if (login.length <= 0)
        e = new Error('Login was not defined');
    else if (pass.length <= 0)
        e = new Error('Password was not defined');

    if(e) {
        errorCallback(e);
        return self;
    }
    else {
        var getToken = function () {
            request({
                url: url.format({
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
                })
            },
            function (err, r, body) {
                if (err)
                    return cb(err);

                var nextQuery = getLoginFormData(body);

                if (!('email' in nextQuery.form))
                    return errorCallback(new Error('Unable to fetch login page'));

                nextQuery.form.email = params.login;
                nextQuery.form.pass = params.pass;

                request({
                        url:    nextQuery.url,
                        method: 'POST',
                        form:   nextQuery.form
                    },
                    function (err, r, body) {
                        if (err)
                            return errorCallback(err);

                        getAllowLink(body, function (err, link) {
                            if (err)
                                return errorCallback(err);

                            request({
                                url:    link,
                                method: 'POST'
                            }, function (err, res) {
                                var access_token = /access_token=([a-f0-9]+)/.exec(res.request.uri.hash);

                                if (!access_token[1])
                                    return errorCallback(new Error('Invalid access_token'));

                                self.access_token = access_token[1];

                                var successfulResult = function () {
                                    cb(null, self.access_token);

                                    self.emit('auth', self.access_token);
                                };

                                // Cache token
                                if (self.cacheToken) {
                                    self.cacheToken.setToken(self.access_token, function (err) {
                                        if (err)
                                            errorCallback(new Error(err));
                                        else
                                            successfulResult();
                                    });
                                } else {
                                    successfulResult();
                                }
                            });
                        })
                    });
            });
        }

        // Getting token, if cache is set, then get token from storage
        if (this.cacheToken) {
            this.cacheToken.getToken(function (token) {
                if (token) {
                    self.access_token = token;
                    
                    self.emit('auth', self.access_token);
                } else {
                    getToken();
                }
            })
        } else {
            getToken();
        }
    }

    function getLoginFormData(html) {
        var $ = cheerio.load(html),
            formData = {};

        var form = $('form[method="post"][action]'),
            inputs = form.find('input[name]');

        inputs.each(function () {
            var e = $(this);
            formData[e.attr('name')] = e.val();
        });

        return {
            url:  form.attr('action'),
            form: formData
        };
    }

    function getAllowLink(html, cb) {
        var $ = cheerio.load(html);

        var err = $('.service_msg_warning');
        if (err.length !== 0)
            return cb(new Error('VK error: ' + err.text()));

        var form = $('form[method="post"][action]');
        if (form.length === 0)
            return cb(new Error('Unable to get link to grant permissions'));

        cb(null, form.attr('action'));
    }

    self.api = function api(method, options, cb) {
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }

        request({
            url: url.format({
                protocol: 'https',
                host:     'api.vk.com',
                pathname: 'method/' + method,
                query:    extend(
                    options,
                    {
                        v:            '5.21',
                        access_token: self.access_token
                    })
            })
        }, function (err, r, json) {
            if (err)
                return cb(err);

            var response = JSON.parse(json);
            if ('error' in response) {
                var e = new Error(response.error.error_msg);
                e.code = response.error.error_code;
                return cb(e);
            }

            if ((!'response' in response))
                return cb(new Error('No `response` field in API response'));

            cb(null, response.response);
        });

        return this;
    };

    return self;
}

util.inherits(authorize, EventEmitter);
module.exports = exports = authorize;
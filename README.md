# vk-dirty-api

VK API for Node.js with authentication using login and password (the dirty way)

Sometimes it is needed to use VK API directly from the Node app, however, using either signing requests or OAuth allows access only to server-side methods. In order to 'overcome' this limitation, this dirty ~~if you know what I mean~~ way of getting access_token for VK API was developed

## Installation
    $ npm install vk-dirty-api

## Usage

### Super simple to use
```javascript
var vkApi = require('vk-dirty-api');

var credentials = {
    app_id:   0,
    user:     'user@example.com', // could be phone number as well
    password: 'your_super_secret_password'
};

var vk = new vkApi(
    credentials.app_id,
    credentials.user,
    credentials.password,
    function (err, access_token) {
        if(err)
            return console.error('Unable to authenticate', err);
        console.log('Successfuly authenticated / access_token:', access_token);
    });
    
vk.on('auth', function (token) {
    vk('users.get', { user_ids: 1 }, function (err, info) {
        if(err)
            return console.error('Unable to complete request', err);
        console.log(info);
    });
});

vk.on('error', function (err) {
    // do authentication fail related stuff... 
});
```

### Methods
#### vk.api(method, [ options ], callback)
- **method** `String` API method that you are willing to use for the request (see [VK Platform Documentation](https://vk.com/dev/method))
- **options** `Object` Fields that will be passed to VK with the used API method 
- **callback** `Function` -

### Events
#### Event: 'auth'
- **token** `String` Access token that is required for future requests
- **expires_in** `Number` Amount of time (seconds) after which this access token will expire
This event is emitted when authorization is successful and access token is returned   

#### Event: 'error'
- **error** `Error` 
This event is triggered when error happens. Currently it is called only when unable to get `access_token` 

## Dependencies
- [request](https://www.npmjs.org/package/request) - making requests to VK API
- [cheerio](https://www.npmjs.org/package/cheerio) - parsing auth pages
- [xtend](https://www.npmjs.org/package/xtend) - extending JavaScript objects

## Changelog
- 0.0.3 - VK API response is now properly parsed, returning `Error` in callback with error code and description when method execution has failed ([list of API errors](https://vk.com/dev/errors))
- 0.0.2 - constructor now emits events on successful authorization and error

## ToDo

- [ ] Error handling
    - [x] Error on authorization fail
    - [x] Handling error in API response
    - [ ] Invalid parameters usage in module methods
- [ ] Caching `access_token`
- [ ] Choosing the version of VK API to use in requests
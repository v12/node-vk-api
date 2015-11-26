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
    client_id: 0,
    login:     'user@example.com', // could be phone number as well
    pass:      'your_super_secret_password'
};

var vk = new vkApi(
    credentials,
    function (err, access_token) {
        if(err)
            return console.error('Unable to authenticate', err);
        console.log('Successfully authenticated / access_token:', access_token);
    });
    
vk.on('auth', function (token) {
    vk.api('users.get', { user_ids: 1 }, function (err, info) {
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
This event is triggered when error happens when initializing VK API.

## Dependencies
- [request](https://www.npmjs.org/package/request) - making requests to VK API
- [cheerio](https://www.npmjs.org/package/cheerio) - parsing auth pages
- [xtend](https://www.npmjs.org/package/xtend) - extending JavaScript objects
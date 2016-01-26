# vk-dirty-api

[![Build Status](https://travis-ci.org/v12/node-vk-api.svg)](https://travis-ci.org/v12/node-vk-api) [![Test Coverage](https://codeclimate.com/github/v12/node-vk-api/badges/coverage.svg)](https://codeclimate.com/github/v12/node-vk-api/coverage) [![Dependency Status](https://david-dm.org/v12/node-vk-api.svg)](https://david-dm.org/v12/node-vk-api)

VK API for Node.js with authentication using login and password (the dirty way)

Sometimes it is needed to use VK API directly from the Node app, however, using either signing requests or OAuth allows access only to server-side methods. In order to 'overcome' this limitation, this dirty ~~if you know what I mean~~ way of getting access_token for VK API was developed

## Installation
    $ npm install vk-dirty-api --save

## Usage

### Super simple to use
```javascript
const vk = require('vk-dirty-api');

const credentials = {
    client_id:    0,
    login:        'user@example.com',
    pass:         'your_super_secret_password',
    phone:        '+74951234567',
    tokenStorage: new vk.TokenStorage()
};

vk.token(credentials)
    .then(function (access_token) {
        console.log('Successfully authenticated / access_token:', access_token);
        
        let api = vk.api(access_token);
        
        return api('account.getInfo', { fields: 'country' })
            .then(info => console.log(info))
            .catch(err => console.error('Unable to complete request', err));
    })
    .catch(err => console.error('Unable to authenticate', err));
```
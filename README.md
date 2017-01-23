# vk-dirty-api

[![Greenkeeper badge](https://badges.greenkeeper.io/v12/node-vk-api.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/v12/node-vk-api.svg?branch=master)](https://travis-ci.org/v12/node-vk-api) [![Test Coverage](https://codeclimate.com/github/v12/node-vk-api/badges/coverage.svg)](https://codeclimate.com/github/v12/node-vk-api/coverage) [![Dependency Status](https://david-dm.org/v12/node-vk-api.svg)](https://david-dm.org/v12/node-vk-api) [![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)


VK API for Node.js with authentication using login and password (the dirty way)

Sometimes it is needed to use VK API directly from the Node app, however, using either signing requests or OAuth allows access only to server-side methods. In order to 'overcome' this limitation, this dirty ~~if you know what I mean~~ way of getting access_token for VK API was developed

## Installation
    $ npm install vk-dirty-api --save

## Usage

### Super simple to use
```javascript
const vk = require('vk-dirty-api')

const credentials = {
  client_id: 0, // application ID (available in app settings at https://vk.com/apps?act=manage)
  login: 'user@example.com',
  pass: 'your_super_secret_password',
  phone: '+74951234567',
  tokenStorage: new vk.TokenStorage() // built-in token storage that stores retrieved access token in file for
                                      // further use
}

/**
 * Retrieve access_token using credentials defined above
 */
vk.token(credentials)
  .then(token => {
    console.log(`Successfully authenticated (access_token: ${token})`)

    /**
     * Use built-in API call helper
     */
    const api = vk.api(token)

    /**
     * Request current account info
     */
    return api('account.getInfo', { fields: 'country' })
      .then(info => console.log('Account info', info))
      .catch(err => console.error('Unable to complete API request', err))
  })
  .catch(err => console.error('Unable to authenticate', err))
```

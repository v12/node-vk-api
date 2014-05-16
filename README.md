# vk-dirty-api

VK API for Node (the dirty way of using it)

## Usage

Simple example of using this module for getting information about user with id1

```javascript
var vkApi = require('vk-dirty-api');

var vk = vkApi(
    client_id,
    'user',
    'password',
    function (err, access_token) {
        if(err)
            return console.error('Unable to authenticate', err);
        console.log('Successfuly authenticated / access_token:', access_token);
        vk('users.get', { user_ids: 1 }, function (err, info) {
            if(err)
                return console.error('Unable to complete request', err);
            console.log(info);
        });
    });
```

## ToDo

- Error handling
- Choosing the version of VK API to use in requests
# Changelog

## 2.0.0

### Breaking changes
* `VK.token(options)` now returns promise that is resolved with access_token
* `VK.api(access_token, [api_version])` returns API request helper function 
* If login is not a phone number, separate parameter `phone` is now required
* Application ID is now being strictly checked for a valid numeric value (coerced to number)
* New `VKAuthError` returned if VK returns an error while attempting to sign in
* New `VKAPIError` returned if API request was fulfilled but API returned error

### Changes
* Fix cookie jar being overridden by the one from the most recent initialization
* Fix invalid check for `response` property in API responses
* Fix `error` event not being fired when initial request for authentication page fails (closes https://github.com/v12/node-vk-api/issues/4)
* Codebase refactored to use ES2015 (Babel.js used for transpiling to ES5)
* Switch to `request`'s JSON parsing
* Update `cheerio` to 0.19.0 from 0.16.0
* Update `request` to 2.67.0 from 2.34.0
* Update `xtend` to 4.0.1 from 3.0.0

## 1.1.1
* Fix error not being thrown when request error happens (closes https://github.com/v12/node-vk-api/issues/3)

## 1.1.0
* Support for token caching (https://github.com/v12/node-vk-api/pull/1)
* Fix possible bug when events were emitted before listeners were attached
* Default User-Agent used now has actual package version

## 1.0.0
* Added another way of instantiating API (both parameter sets are available)

## 0.0.3 
* VK API response is now properly parsed, returning `Error` in callback with error code and description when method execution has failed ([list of API errors](https://vk.com/dev/errors))

## 0.0.2 
* Constructor now emits events on successful authorization and error
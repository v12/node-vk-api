# Changelog

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
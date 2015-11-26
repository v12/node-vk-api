# Changelog

## 1.0.0
* Added another way of instantiating API (both parameter sets are available)

## 0.0.3 
* VK API response is now properly parsed, returning `Error` in callback with error code and description when method execution has failed ([list of API errors](https://vk.com/dev/errors))

## 0.0.2 
* Constructor now emits events on successful authorization and error
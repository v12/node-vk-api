'use strict';

/**
 * Default token storage
 *
 * @module vkDirtyAPI/TokenStorage
 **/

var fs = require('fs-jetpack');

/**
 * @param {String} [file] Path to the file where token is stored
 * @constructor
 */
function TokenStorage (file) {
    this.storageFile = file || process.cwd() + '/.vk-token';
}

TokenStorage.prototype.setStorageFile = function (file) { this.storageFile = file; };

TokenStorage.prototype.getToken = function () { return fs.readAsync(this.storageFile); };

TokenStorage.prototype.setToken = function (token) {
    return this.getToken()
        .then(function (storedToken) {
            if (storedToken !== token)
                return fs.writeAsync(this.storageFile, token);
        }.bind(this));
};

module.exports = TokenStorage;
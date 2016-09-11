'use strict'

/**
 * Default token storage
 *
 * @module vkDirtyAPI/TokenStorage
 **/

const fs = require('fs-jetpack')

class TokenStorage {
  /**
   * @param {String} [path] Path to the file where token is stored
   */
  constructor (path = process.cwd() + '/.vk-token') {
    this.storageFile = path
  }

  setStorageFile (path) {
    this.storageFile = path
  }

  getToken () {
    return fs.readAsync(this.storageFile)
  }

  setToken (token) {
    return this.getToken().then(storedToken => {
      if (storedToken !== token) {
        return fs.writeAsync(this.storageFile, token)
      }
    })
  }
}

module.exports = TokenStorage

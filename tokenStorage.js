/**
* Default storage a token
**/

var fs = require('fs');

function TokenStorage(storageFilePath) {
	this.storagePathFile = storageFilePath || __dirname +'/local/token.txt';
	this.authData;

	this._checkFile = function (filepath, callback) {
		fs.exists(filepath, function (status) {
			if (status) {
				callback();
			} else {
				fs.writeFile(filepath, '', function (err) {
					if (err) throw err;

					callback();
				});
			}
		});
	};
}

TokenStorage.prototype.setFilePath = function (storageFilePath) {
	this.storagePath = storagePathFile;
};

TokenStorage.prototype.getToken = function (callback) {
	var self = this;

	this._checkFile(this.storagePathFile, function () {
		fs.readFile(self.storagePathFile, function (err, token) {
			if (err) throw err;

			callback(token.toString());
		});
	})
};

TokenStorage.prototype.setToken = function (token, callback) {
	var self = this;

	this.getToken(function (tokenStorage) {
		if (tokenStorage != token) {
			fs.writeFile(self.storagePathFile, token, function (err) {
				if (err) throw err;

				if (callback) callback();
			});
		}
	});
}

module.exports = TokenStorage;
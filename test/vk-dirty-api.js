var mocha = require('mocha');
var chai  = require('chai');

var expect = chai.expect;

describe('vk-dirty-api', function () {
    before(function (cb) {
        var self = this;

        self.VK  = require(__dirname + '/..');

        self.api = new self.VK({
                client_id: process.env.VK_APP_ID,
                login:     process.env.VK_LOGIN,
                pass:      process.env.VK_PASS
            },
            function (err, access_token) {
                if (err) return cb(err);

                self.token = access_token;
                cb();
            });
    });

    it('should be an EventEmitter', function () {
        expect(this.VK).to.respondTo('on');
        expect(this.VK).to.respondTo('once');
    });

    it('should receive access token when successfully authorized', function () {
        expect(this.token).to.be.a('string');
    });
});
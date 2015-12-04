'use strict';

var mocha = require('mocha');
var chai  = require('chai');

var expect = chai.expect;

describe('vk-dirty-api', function () {
    before(function (cb) {
        var self = this;

        self.VK = require(__dirname + '/..');

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

    describe('errors', function () {
        [ 'VKAPIError', 'VKAuthError' ].forEach(e => it('should expose custom error ' + e, function () {
            expect(this.VK).to.respondTo(e);
            expect(this.VK).to.itself.respondTo(e);
        }));

        describe('VKAPIError', function () {
            it('should have error_code and error_msg attributes', function () {
                var code = 1,
                    msg  = 'Dummy error',
                    e    = new this.VK.VKAPIError(code, msg);

                expect(e).to.have.property('error_code', code);
                expect(e).to.have.property('error_msg', msg);
            });
        });
    });

    describe('API request', function () {
        it('should be completed successfully', function (cb) {
            this.api.api('account.getInfo', function (err, res) {
                if (err) return cb(err);

                expect(res).to.be.an('object');
                expect(res).to.have.any.key('https_required');

                cb();
            });
        });
    });
});
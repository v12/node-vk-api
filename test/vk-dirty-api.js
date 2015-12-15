'use strict';

var mocha = require('mocha');
var chai  = require('chai');

chai.use(require('chai-as-promised'));

var expect = chai.expect;

describe('vk-dirty-api', function () {
    var vk = require(__dirname + '/..');

    before(function () {
        return vk.token({
            client_id: process.env.VK_APP_ID,
            login:     process.env.VK_LOGIN,
            pass:      process.env.VK_PASS,
            phone:     process.env.VK_PHONE
        }).then(token => this.token = token);
    });

    it('should receive access token when successfully authorized', function () {
        expect(this.token).to.be.a('string');
    });

    describe('errors', function () {
        [ 'VKAPIError', 'VKAuthError' ].forEach(e => it('should expose custom error ' + e, function () {
            expect(vk).to.respondTo(e);
            expect(vk).to.itself.respondTo(e);
        }));

        describe('VKAPIError', function () {
            it('should have error_code and error_msg attributes', function () {
                var code = 1,
                    msg  = 'Dummy error',
                    e    = new vk.VKAPIError(code, msg);

                expect(e).to.have.property('error_code', code);
                expect(e).to.have.property('error_msg', msg);
            });
        });
    });

    describe('API helper', function () {
        it('should return request function', function () {
            expect(vk.api(this.token)).to.be.a('function');
        });

        describe('request', function () {
            before(function () {
                this.request = vk.api(this.token);
            });

            it('should be completed successfully', function () {
                return this.request('account.getInfo', { fields: 'https_required' })
                    .then(function (res) {
                        expect(res).to.be.an('object');
                        expect(res).to.have.keys('https_required');
                    });
            });
        });
    });
});
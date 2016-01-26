'use strict';

var fs = require('fs');

var mocha = require('mocha');
var chai  = require('chai');

chai.use(require('chai-as-promised'));

var expect = chai.expect;

describe('parsers', function () {
    var parsers = require('../src/parsers');

    before(function () {
        this.pages = {};

        var path = __dirname + '/html/';

        fs.readdirSync(path).forEach(f => this.pages[ f.replace(/\.html$/, '') ] = fs.readFileSync(path + f));
    });

    describe('#parseAllowButtonHref', function () {
        it('should return valid URL', function () {
            return expect(parsers.parseAllowButtonHref(this.pages.allow)).to.eventually.equal('https://login.vk.com/?act=grant_access&client_id=1&settings=2&redirect_uri=https%3A%2F%2Foauth.vk.com%2Fblank.html&state=nostate&response_type=token&direct_hash=123456789123456789&token_type=0&v=5.55&display=mobile&ip_h=123456789123456789&hash=987654321987654321&https=1');
        });

        it('should return error when there is no \'Allow\' button URL', function () {
            return expect(parsers.parseAllowButtonHref('<html><body></body></html>')).to.be.rejectedWith(Error);
        });
    });

    describe('#parseLoginFormFields', function () {
        it('should return action URL and form fields', function () {
            var result = parsers.parseLoginForm(this.pages.login);

            expect(result).to.eventually.be.an('object');
            expect(result).to.become({
                url:    'https://login.vk.com/?act=login&soft=1&utf8=1',
                fields: {
                    _origin: 'https://oauth.vk.com',
                    ip_h:    '123456789123456789',
                    lg_h:    '987654321987654321',
                    to:      'some_random_value',
                    email:   '',
                    pass:    undefined
                }
            });
        });
    });

    describe('#securityCheckForm', function () {
        it('should return action URL and form fields', function () {
            var result = parsers.securityCheckForm(this.pages.security_check, '+74951234567');

            expect(result).to.eventually.be.an('object');
            expect(result).to.eventually.have.keys('url', 'fields');
            expect(result).to.eventually.have.property('fields', { code: '49512345' });
        });

        it('should throw an error when phone number is not provided', function () {
            return expect(parsers.securityCheckForm('<html></html>')).to.eventually.be.rejected;
        });
    });

    describe('leading zeroes and + removal', function () {
        it('should left trim string', function () {
            var checks = {
                ' +7495': '7495',
                '+7495+': '7495+',
                '+1':     '1',
                '007495': '7495',
                '001':    '1'
            };

            Object.keys(checks).forEach(value => expect(parsers._trimPhone(value)).to.be.equal(checks[ value ]));
        });
    });
});
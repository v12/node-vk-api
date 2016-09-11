'use strict'

const path = require('path')
const chai = require('chai')
const nock = require('nock')

nock.disableNetConnect()

chai.use(require('chai-as-promised'))

const expect = chai.expect

const config = {
  client_id: 1,
  login: 'john.doe@example.com',
  pass: 'password',
  phone: '+74951234567'
}

const allowLinkParams = {
  act: 'grant_access',
  client_id: config.client_id,
  settings: 2,
  redirect_uri: 'https://oauth.vk.com/blank.html',
  state: 'nostate',
  response_type: 'token',
  direct_hash: '123456789123456789',
  token_type: 0,
  v: '5.55',
  display: 'mobile',
  ip_h: '123456789123456789',
  hash: '987654321987654321',
  https: 1
}

function mockLoginPage () {
  nock('https://oauth.vk.com')
    .get('/authorize')
    .query(true)
    .replyWithFile(200, path.join(__dirname, '/html/login.html'))
}

function mockAllowLinkPage (successful) {
  let host = nock('https://login.vk.com')

  host
    .post('/')
    .query({ act: 'login' })
    .replyWithFile(200, path.join(__dirname, '/html/allow.html'))

  if (successful) {
    host
      .post('/')
      .query(allowLinkParams)
      .reply(302, null, { Location: 'https://oauth.vk.com/blank.html#access_token=123' })
  }
}

function mockSuccessfulLoginPage () {
  nock('https://login.vk.com')
    .post('/')
    .query({ act: 'login' })
    .reply(302, null, { Location: 'https://oauth.vk.com/blank.html#access_token=123' })
}

function mockBlankPage () {
  nock('https://oauth.vk.com')
    .get('/blank.html')
    .reply(200, '')
}

function mockQuick () {
  mockLoginPage()
  mockBlankPage()
  mockSuccessfulLoginPage()
}

function mockFull () {
  mockLoginPage()
  mockBlankPage()
  mockAllowLinkPage(true)
}

describe('vk-dirty-api', function () {
  const vk = require(path.join(__dirname, '/../src/vk-dirty-api'))

  afterEach(() => nock.cleanAll())

  describe('initialization', function () {
    it('should accept config object', function () {
      mockQuick()
      return expect(vk.token(config)).to.be.eventually.equal('123')
    })

    it('should accept (client_id, login, pass, phone)', function () {
      mockQuick()
      return expect(vk.token(config.client_id, config.login, config.pass, config.phone))
        .to.be.eventually.equal('123')
    })

    it('should reject when invalid amount of arguments supplied', function () {
      return expect(vk.token(123, '123')).to.be.eventually.rejected
    })

    it('should reject when no configuration provided', function () {
      return expect(vk.token()).to.be.eventually.rejected
    })

    it('should reject when login is not a phone number and no phone is provided', function () {
      return Promise.all([
        expect(vk.token(config.client_id, config.login, config.pass)).to.be.eventually.rejected,
        expect(vk.token({
          client_id: config.client_id,
          login: config.login,
          pass: config.pass
        })).to.be.eventually.rejected
      ])
    })
  })

  it('should receive access token when successfully authorized', function () {
    mockFull()
    return expect(vk.token(config)).to.be.eventually.equal('123')
  })

  it('should reject when invalid parameters supplied', function () {
    return Promise.all([
      expect(vk.token('invalid_id')).to.eventually.rejected,
      expect(vk.token(config.client_id, '1', '123')).to.be.eventually.rejected,
      expect(vk.token(config.client_id, null, '123')).to.be.eventually.rejected,
      expect(vk.token(config.client_id, null, '123')).to.be.eventually.rejected,
      expect(vk.token(config.client_id, config.login, null, config.phone)).to.be.eventually.rejected,
      expect(vk.token(config.client_id, config.login, config.pass, 'no_phone')).to.be.eventually.rejected,
      expect(vk.token(config.client_id, config.login, config.pass, null)).to.be.eventually.rejected,
      expect(vk.token(Object.assign({}, config, { scope: { invalid: 'scope' } }))).to.be.eventually.rejected,
      expect(vk.token(Object.assign({}, config, { tokenStorage: 'none' }))).to.be.eventually.rejected,
      expect(vk.token(Object.assign({}, config, { tokenStorage: {} }))).to.be.eventually.rejected
    ])
  })

  it('should reject when received invalid login page', function () {
    nock('https://oauth.vk.com')
      .get('/authorize')
      .query(true)
      .reply(200, '')

    return expect(vk.token(config)).to.be.eventually.rejectedWith('Unable to fetch login page')
  })

  it('should reject when unable to retrieve login page', function () {
    nock('https://oauth.vk.com')
      .get('/authorize')
      .query(true)
      .reply(500)

    return expect(vk.token(config)).to.be.eventually.rejected
  })

  it('should reject when no token received after successful login', function () {
    mockLoginPage()
    mockAllowLinkPage()
    mockBlankPage()

    nock('https://login.vk.com')
      .post('/')
      .query(allowLinkParams)
      .reply(302, null, { Location: 'https://oauth.vk.com/blank.html#no_token' })

    return expect(vk.token(config)).to.be.eventually.rejectedWith('Invalid access_token')
  })

  describe('errors', function () {
    ['VKAPIError', 'VKAuthError'].forEach(e => it('should expose custom error ' + e, function () {
      expect(vk[e]()).to.be.an.instanceOf(Error)
      expect(vk).to.itself.respondTo(e)
    }))

    describe('VKAPIError', function () {
      it('should have error_code and error_msg attributes', function () {
        const code = 1
        const msg = 'Dummy error'
        const e = new vk.VKAPIError(code, msg)

        expect(e).to.have.property('error_code', code)
        expect(e).to.have.property('error_msg', msg)
      })
    })
  })

  describe('API helper', function () {
    before(function () {
      this.apiHost = nock('https://api.vk.com')
    })

    it('should return request function', function () {
      expect(vk.api('123')).to.be.a('function')
    })

    describe('request', function () {
      before(function () {
        this.request = vk.api('123')
      })

      it('should be completed successfully', function () {
        const response = { https_required: true }

        this.apiHost
          .get('/method/account.getInfo')
          .query({
            v: '5.21',
            fields: 'https_required',
            access_token: '123'
          })
          .reply(200, { response })

        return this.request('account.getInfo', { fields: 'https_required' })
          .then(function (res) {
            expect(res).to.be.an('object')
            expect(res).to.have.keys('https_required')
          })
      })

      it('should return VKAPIError when API error received', function () {
        this.apiHost
          .get('/method/wall.get')
          .query({ v: '5.21', access_token: '123' })
          .reply(200, { error: { error_code: 5, error_msg: 'Test error message' } })

        return expect(this.request('wall.get')).to.be.eventually.rejectedWith(vk.VKAPIError)
      })

      it('should return error for invalid API response', function () {
        this.apiHost
          .get('/method/wall.get')
          .query({ v: '5.21', access_token: '123' })
          .reply(200, { invalid: 'response' })

        return expect(this.request('wall.get'))
          .to.be.eventually.rejectedWith('No `response` field in API response')
      })
    })
  })
})

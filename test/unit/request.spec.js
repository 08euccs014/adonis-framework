'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Request = require('../../src/Request')
const SessionManager = require('../../src/Session/SessionManager')
const http = require('http')
const File = require('../../src/File')
const https = require('https')
const supertest = require('co-supertest')
const pem = require('pem')
const formidable = require('formidable')
const querystring = require("querystring")
const co = require('co')

const Config = {
  get: function (key) {
    switch (key) {
      case 'http.trustProxy':
        return true
      case 'app.appKey':
        return null
      default:
        return 2
    }
  }
}

require('co-mocha')

describe('Request', function () {

  it('should get request query string', function * () {

    const server = http.createServer(function (req, res) {

      const request = new Request(req, res, Config)
      const query = request.get()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({query}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.query).to.be.an('object')
    expect(res.body.query).deep.equal({name:"foo"})

  })

  it('should return empty object when request does not have query string', function * () {

    const server = http.createServer(function (req, res) {

      const request = new Request(req, res, Config)
      const query = request.get()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({query}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.query).to.be.an('object')
    expect(res.body.query).deep.equal({})

  })

  it('should get request post data', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {name:"foo"}
      const request = new Request(req, res, Config)
      const body = request.post()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({body}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.body).to.be.an('object')
    expect(res.body.body).deep.equal({name:"foo"})
  })

  it('should return empty object when post body does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const body = request.post()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({body}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.body).to.be.an('object')
    expect(res.body.body).deep.equal({})
  })

  it('should get value for a given key using input method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input("name")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.name).to.equal("foo")
  })

  it('should return null when value for input key is not available', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input("name")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.name).to.equal(null)
  })

  it('should return default value when value for input key is not available', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.input("name", "doe")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.name).to.equal('doe')
  })


  it('should return get and post values when using all', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.all()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({name:"foo",age:22})
  })

  it('should return all values expect defined keys', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.except('age')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({name:"foo"})
  })

  it('should return all values expect defined keys when defined as an array', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.except(['age'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({name:"foo"})
  })

  it('should not return key/value pair for key that does not exists', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.except(['foo'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({name:"foo",age:22})
  })


  it('should return all values for only defined keys', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.only('age')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({age:22})
  })

  it('should return all values for only defined keys when keys are defined as array', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.only(['age'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({age:22})
  })

  it('should not return key/value pair for key that does not exists', function * () {
    const server = http.createServer(function (req, res) {
      req._body = {age:22}
      const request = new Request(req, res, Config)
      const all = request.only(['foo'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({all}),'utf8')
    })

    const res = yield supertest(server).get("/?name=foo").expect(200).end()
    expect(res.body.all).deep.equal({})
  })


  it('should return all headers for a given request', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const headers = request.headers()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({headers}),'utf8')
    })

    const res = yield supertest(server).get("/").set('username','admin').expect(200).end()
    expect(res.body.headers).to.have.property("username")
    expect(res.body.headers.username).to.equal("admin")
  })

  it('should return header value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const username = request.header("username")
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({username}),'utf8')
    })

    const res = yield supertest(server).get("/").set('username','admin').expect(200).end()
    expect(res.body.username).to.equal("admin")
  })

  it('should check for request freshness', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const fresh = request.fresh()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({fresh}),'utf8')
    })

    const res = yield supertest(server).get("/").set('if-none-match','*').expect(200).end()
    expect(res.body.fresh).to.equal(true)
  })

  it('should tell whether request is stale or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const stale = request.stale()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({stale}),'utf8')
    })

    const res = yield supertest(server).get("/").set('if-none-match','*').expect(200).end()
    expect(res.body.stale).to.equal(false)
  })

  it('should return best match for request ip address', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const ip = request.ip()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({ip}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.ip).to.match(/127\.0\.0\.1/)
  })

  it('should return all ip addresses from a given request', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const ips = request.ips()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({ips}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.ips).to.be.an('array')
  })

  it('should tell whether request is https or not', function (done) {

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    pem.createCertificate({days:1, selfSigned:true}, function(err, keys){

      const server = https.createServer({key: keys.serviceKey, cert: keys.certificate},function (req, res) {
        const request = new Request(req, res, Config)
        const secure = request.secure()
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({secure}),'utf8')
      })

      supertest(server)
      .get("/")
      .expect(200)
      .end(function (err, res){
        if(err){
          done(err)
          return
        }
        expect(res.body.secure).to.equal(true)
        server.close()
        done()
      })
    });
  })

  it('should return request subdomains', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const subdomains = request.subdomains()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({subdomains}),'utf8')
    })

    const res = yield supertest(server).get("/").set('X-Forwarded-Host','virk.adonisjs.com').expect(200).end()
    expect(res.body.subdomains).deep.equal(['virk'])
  })

  it('should tell whether request is ajax or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const ajax = request.ajax()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({ajax}),'utf8')
    })

    const res = yield supertest(server).get("/").set('X-Requested-With','xmlhttprequest').expect(200).end()
    expect(res.body.ajax).to.equal(true)
  })

  it('should tell whether request is pjax or not', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const pjax = request.pjax()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({pjax}),'utf8')
    })

    const res = yield supertest(server).get("/").set('X-PJAX',true).expect(200).end()
    expect(res.body.pjax).to.equal(true)
  })

  it('should return request host name', function * () {

    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const hostname = request.hostname()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({hostname}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.hostname).to.equal('127.0.0.1')
  })


  it('should return request url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const url = request.url()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({url}),'utf8')
    })

    const res = yield supertest(server).get("/?query=string").expect(200).end()
    expect(res.body.url).to.equal('/')
  })

  it('should return request original url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const originalUrl = request.originalUrl()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({originalUrl}),'utf8')
    })

    const res = yield supertest(server).get("/?query=string").expect(200).end()
    expect(res.body.originalUrl).to.equal('/?query=string')
  })

  it('should return request method', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const method = request.method()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({method}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.method).to.equal('GET')
  })

  it('should tell whether request is of certain type', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const isHtml = request.is('html')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({isHtml}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Content-type','text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell whether request is of certain type when an array of options have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const isHtml = request.is(['json', 'html'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({isHtml}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Content-type','text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell whether request is of certain type when multiple arguments have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const isHtml = request.is('json', 'javascript', 'html')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({isHtml}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Content-type','text/html').expect(200).end()
    expect(res.body.isHtml).to.equal(true)
  })

  it('should tell best response type request will accept', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const html = request.accepts('html')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({html}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Accept','text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should tell best response type request will accept when an array of options have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const html = request.accepts(['json', 'html'])
      console.log(html)
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({html}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Accept','text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should tell best response type request will accept when multiple arguments have been passed', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const html = request.accepts('json','javascript', 'html')
      console.log(html)
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({html}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Accept','text/html').expect(200).end()
    expect(res.body.html).to.equal('html')
  })

  it('should return request cookies', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const cookies = request.cookies()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({cookies}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({name:"foo"})
  })

  it('should not reparse cookies after calling cookies method multiple times', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request.cookies()
      request.cookiesObject.age = 22
      const cookiesAgain = request.cookies()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({cookies:cookiesAgain}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.cookies).deep.equal({name:"foo",age:22})
  })

  it('should return cookie value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const name = request.cookie('name')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.name).to.equal("foo")
  })

  it('should return null when cookie value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const age = request.cookie('age')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({age}),'utf8')
    })

    const res = yield supertest(server).get("/").set('Cookie',['name=foo']).expect(200).end()
    expect(res.body.age).to.equal(null)
  })

  it('should return route params', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id:1}
      const params = request.params()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({params}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.params).deep.equal({id:1})
  })

  it('should return empty object when request params does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const params = request.params()
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({params}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.params).deep.equal({})
  })

  it('should return request param value for a given key', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id:1}
      const id = request.param('id')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({id}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.id).to.equal(1)
  })

  it('should return null when param value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id:1}
      const name = request.param('name')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.name).to.equal(null)
  })

  it('should return default value when param value for a given key does not exists', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      request._params = {id:1}
      const name = request.param('name', 'bar')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({name}),'utf8')
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.name).to.equal('bar')
  })


  it('should return an uploaded file as an instance of File object', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm();
      const request = new Request(req, res, Config)
      form.parse(req, function(err, fields, files) {
        request._files = files
        const file = request.file('logo')
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({file:file instanceof File}),'utf8')
      })
    })
    const res = yield supertest(server).get("/").attach('logo',__dirname+'/uploads/npm-logo.svg').expect(200).end()
    expect(res.body.file).to.equal(true)
  })

  it('should return true when a pattern matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user/:id/profile')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({matches}),'utf8')
    })

    const res = yield supertest(server).get("/user/1/profile").expect(200).end()
    expect(res.body.matches).to.equal(true)
  })

  it('should return false when a pattern does not matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({matches}),'utf8')
    })

    const res = yield supertest(server).get("/user/1/profile").expect(200).end()
    expect(res.body.matches).to.equal(false)
  })

  it('should return true when any of the paths inside array matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match(['/user', '/user/1/profile'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({matches}),'utf8')
    })
    const res = yield supertest(server).get("/user/1/profile").expect(200).end()
    expect(res.body.matches).to.equal(true)
  })

  it('should return false when none of the paths inside array matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match(['/user', '/user/1', '/1/profile'])
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({matches}),'utf8')
    })
    const res = yield supertest(server).get("/user/1/profile").expect(200).end()
    expect(res.body.matches).to.equal(false)
  })

  it('should return true when any of the paths from any of the arguments matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user', '/user/1/profile')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({matches}),'utf8')
    })

    const res = yield supertest(server).get("/user/1/profile").expect(200).end()
    expect(res.body.matches).to.equal(true)
  })

  it('should return false when any of the paths from any of the arguments does not matches the current route url', function * () {
    const server = http.createServer(function (req, res) {
      const request = new Request(req, res, Config)
      const matches = request.match('/user', '/user/1', '/user/profile')
      res.writeHead(200, {"Content-type":"application/json"})
      res.end(JSON.stringify({matches}),'utf8')
    })

    const res = yield supertest(server).get("/user/1/profile").expect(200).end()
    expect(res.body.matches).to.equal(false)
  })

  it('should return an empty file instance when file is not uploaded', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm();
      const request = new Request(req, res, Config)
      form.parse(req, function(err, fields, files) {
        request._files = files
        const file = request.file('logo')
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({exists:file.exists()}),'utf8')
      })
    })
    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.exists).to.equal(false)
  })

  it('should return all uploaded file as an instance of File object', function * () {
    const server = http.createServer(function (req, res) {
      var form = new formidable.IncomingForm();
      const request = new Request(req, res, Config)
      form.parse(req, function(err, fields, files) {
        request._files = files
        const allFiles = request.files()
        const isInstances = []
        allFiles.forEach(function (file) {
          isInstances.push(file instanceof File)
        })
        res.writeHead(200, {"Content-type":"application/json"})
        res.end(JSON.stringify({isInstances}),'utf8')
      })
    })
    const res = yield supertest(server).get("/").attach('logo',__dirname+'/uploads/npm-logo.svg').attach('favicon',__dirname+'/public/favicon.ico').expect(200).end()
    expect(res.body.isInstances).deep.equal([true,true])
  })

  it('should throw an error when flash message is not an object', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        yield request.flash('username', 'foo')
      }).then(function () {
        res.writeHead(200)
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify({message:err.message}))
      })
    })

    const res = yield supertest(server).get("/").expect(500).end()
    expect(res.body.message).to.match(/Flash values should be an object/)
  })

  it('should flash messages to session', function * () {

    SessionManager.driver = 'cookie'
    SessionManager.options = {}
    SessionManager.options.cookie = 'adonis-session'
    SessionManager.options.browserClear = true
    SessionManager.config = Config
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        yield request.flash({username:'foo'})
      }).then(function () {
        res.writeHead(200)
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/").expect(200).end()
    const flashMessage = res.headers['set-cookie'][0].split('=')
    let body = {}
    body.flash_messages = {d:JSON.stringify({username:'foo'}),t:'Object'}
    expect(flashMessage[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))
  })

  it('should read flash messages and if set clear them off from request', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        request._flash_messages = yield sessionManager.pull('flash_messages', {})
        return request.old('username')
      }).then(function (response) {
        res.writeHead(200, {"content-type":"application/json"})
        res.end(JSON.stringify({response}))
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const body = {}
    body.flash_messages = {d:JSON.stringify({username:'virk'}),t:'Object'}
    const res = yield supertest(server).get("/").set('Cookie',['adonis-session=j:'+JSON.stringify(body)]).expect(200).end()
    expect(res.body.response).to.equal('virk')
  })

  it('should return null when flash message value does not exists', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        request._flash_messages = yield sessionManager.pull('flash_messages', {})
        return request.old('username')
      }).then(function (response) {
        res.writeHead(200, {"content-type":"application/json"})
        res.end(JSON.stringify({response}))
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.response).to.equal(null)
  })


  it('should return default value when flash message value does not exists', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        request._flash_messages = yield sessionManager.pull('flash_messages', {})
        return request.old('username', 'foo')
      }).then(function (response) {
        res.writeHead(200, {"content-type":"application/json"})
        res.end(JSON.stringify({response}))
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.response).to.equal('foo')
  })

  it('should auto set flash messages to an empty object when it does exists', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        return request.old('username', 'foo')
      }).then(function (response) {
        res.writeHead(200, {"content-type":"application/json"})
        res.end(JSON.stringify({response}))
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/").expect(200).end()
    expect(res.body.response).to.equal('foo')
  })

  it('should flash all request inputs using flashAll method', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        return yield request.flashAll()
      }).then(function () {
        res.writeHead(200, {"content-type":"application/json"})
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/?username=foo&age=22").expect(200).end()
    const flashMessage = res.headers['set-cookie'][0].split('=')
    let body = {}
    body.flash_messages = {d:JSON.stringify({username:'foo',age:"22"}),t:'Object'}
    expect(flashMessage[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))
  })

  it('should flash all request inputs except defined keys using flashExcept method', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        return yield request.flashExcept('age')
      }).then(function () {
        res.writeHead(200, {"content-type":"application/json"})
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/?username=foo&age=22").expect(200).end()
    const flashMessage = res.headers['set-cookie'][0].split('=')
    let body = {}
    body.flash_messages = {d:JSON.stringify({username:'foo'}),t:'Object'}
    expect(flashMessage[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))
  })

  it('should flash all request inputs except defined keys using flashExcept method when passing array', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        return yield request.flashExcept(['age'])
      }).then(function () {
        res.writeHead(200, {"content-type":"application/json"})
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/?username=foo&age=22").expect(200).end()
    const flashMessage = res.headers['set-cookie'][0].split('=')
    let body = {}
    body.flash_messages = {d:JSON.stringify({username:'foo'}),t:'Object'}
    expect(flashMessage[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))
  })

  it('should flash all request inputs only for defined keys using flashOnly method', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        return yield request.flashOnly('age')
      }).then(function () {
        res.writeHead(200, {"content-type":"application/json"})
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/?username=foo&age=22").expect(200).end()
    const flashMessage = res.headers['set-cookie'][0].split('=')
    let body = {}
    body.flash_messages = {d:JSON.stringify({age:'22'}),t:'Object'}
    expect(flashMessage[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))
  })

  it('should flash all request inputs only for defined keys using flashOnly method when passing an array', function * () {

    SessionManager.driver = 'cookie'
    let sessionManager

    const server = http.createServer(function (req, res) {
      sessionManager = new SessionManager(req, res)
      const request = new Request(req, res, Config)
      request.session = sessionManager
      co(function * () {
        return yield request.flashOnly(['age'])
      }).then(function () {
        res.writeHead(200, {"content-type":"application/json"})
        res.end()
      }).catch(function (err) {
        res.writeHead(500, {"content-type":"application/json"})
        res.end(JSON.stringify(err))
      })
    })

    const res = yield supertest(server).get("/?username=foo&age=22").expect(200).end()
    const flashMessage = res.headers['set-cookie'][0].split('=')
    let body = {}
    body.flash_messages = {d:JSON.stringify({age:'22'}),t:'Object'}
    expect(flashMessage[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))
  })

})

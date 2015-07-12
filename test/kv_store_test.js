var expect = require('chai').expect;
var request = require('supertest');
var app = require('../app');

describe('KVStore', function () {

  var KV = {
    key: Date.now(),
    value: Math.random()
  };

  it('should set', function (done) {
    request(app.listen())
    .post('/')
    .type('json')
    .send(KV)
    .expect(200)
    .end(function (e, res) {
      expect(e).not.to.be.ok;
      expect(res.body).to.be.ok;
      done();
    });
  });

  it('should get', function (done) {
    request(app.listen())
    .get('/')
    .type('json')
    .query({key: KV.key})
    .expect(200)
    .expect(new RegExp('' + KV.value))
    .end(done)
  });

});

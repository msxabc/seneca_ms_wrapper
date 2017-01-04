var expect = require('expect.js');
var Microservice = require('../lib');
var _ = require('lodash');

describe('microservices', function() {
  this.timeout(10000);
  var ms = new Microservice({
    rabbit: {
      serverPin: {
        role: 'test', cmd: '*'
      }
    }
  });
  var ms2 = new Microservice({rabbit: {clientOnly: true}});
  before('initialize a microservice', function() {
    return ms.ready.then(function() {
      return ms2.ready;
    });
  });

  it('return a value from a handler', function() {
    ms.add({role:'test', cmd: 'GetValues#2'}, function (msg, respond) {
      return 'a value';
    });

    return ms2.act({role:'test', cmd: 'GetValues#2', data: { param1: 'wrongparam' }})
    .then(function(value) {
      expect(value).to.be('a value');
    });
  });

  it('throw an error from a handler', function() {
    ms.add({role:'test', cmd: 'GetValues#3'}, function (msg, respond) {
      throw new Error('error');
    });

    return ms2.act({role:'test', cmd: 'GetValues#3', data: { param1: 'wrongparam' }})
    .then(function(value) {
      throw new Error('should fail');
    })
    .catch(function(err) {
      expect(err.message).to.be('error');
      expect(err.stack).to.be.ok();
    });
  });

  it('return a promise from a handler', function() {
    ms.add({role:'test', cmd: 'GetValues#3'}, function (msg, respond) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve('a value');
        }, 1000);
      });
    });
    return ms2.act({role:'test', cmd: 'GetValues#3', data: { param1: 'wrongparam' }})
    .then(function(value) {
      expect(value).to.be('a value');
    });
  });

  it('subscribes to an event and publishes', function(done) {
    var count = 0;
    var publishData = {data:'data'};
    ms.Promise.all([1, 2, 3].map(function() {
      return ms.subscribe('testevent', function (msg) {
        expect(msg).to.eql(publishData);
        ++count;
        console.log('event handler #' + count);
        if(count === 3) {
          done();
        }
      });
    }))
    .then(function() {
      return ms2.publish('testevent', publishData);
    })
    .catch(done);
  });

  it('long action', function() {
    this.timeout(500000);
    ms.add({role:'test', cmd: 'GetValues#4'}, function (msg, respond) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve('a value##');
        }, 30000);
      });
    });
    return ms2.act({role:'test', cmd: 'GetValues#4', data: { param1: 'wrongparam' }, timeout: 120000})
    .then(function(value) {
      expect(value).to.be('a value##');
    });
  });


});

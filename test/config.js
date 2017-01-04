var expect = require('expect.js');
var Microservice = require('../lib');
var _ = require('lodash');
var Promise = require('bluebird');

describe('config', function() {
  it('merge order', function() {
    var configOverride = {
      rabbit: {
        serverPin: {"role":"custom", "cmd":"*"},
        clientPin: {"role":"custom", "cmd":"*"}
      }
    };
    var ms = new Microservice(configOverride);
    return ms.ready.then(function() {
      expect(ms.config.rabbit.serverPin).to.be.eql(configOverride.rabbit.serverPin);
      expect(ms.config.rabbit.clientPin).to.be.eql(configOverride.rabbit.clientPin);
    })
    .finally(function() {
      ms.close();
    });
  });
});

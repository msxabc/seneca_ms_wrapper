var expect = require('expect.js');
var Microservice = require('../lib');
var _ = require('lodash');
var Promise = require('bluebird');

describe('entity', function() {
  var entityIds = [];
  var entities = [];
  var ms = new Microservice();
  before(function() {
    return ms.ready;
  });

  after(function() {
    ms.close();
  });

  it('save an entity', function() {
    var promises = [1, 2].map(function() {
      var entity = ms.seneca.make('aTestEntity');
      entity.testField = 'testValue';
      return entity.save$()
      .then(function(entry) {
        expect(entry).to.be.ok();
        expect(entry.id).to.be.ok();
        entityIds.push(entry.id);
      });
    });
    return Promise.all(promises);
  });

  it('load an entity', function() {
    var entity = ms.seneca.make('aTestEntity');
    return entity.load$({id: entityIds[0]})
    .then(function(entry) {
      if(!entry) {
        throw new Error('no entity found');
      }
      expect(entry.testField).to.be('testValue');
    });
  });

  it('list entities', function() {
    var entity = ms.seneca.make('aTestEntity');
    return entity.list$()
    .then(function(entries) {
      if(!entries) {
        throw new Error('no entities found');
      }
      console.log(entries);
      expect(entries.length).to.be.above(1);
      entities = entries;
    });
  });

  it('delete all entities', function() {
    var entity = ms.seneca.make('aTestEntity');
    var promises = entities.map(function(entityObject) {
      return entity.delete$({id: entityObject.id})
      .then(function(entry) {
        expect(entry).to.be.ok();
        var deletedId = entry._id;
        return entity.load$({id: entityObject.id})
        .then(function(entry) {
          if(entry) {
            throw new Error('shouldve been deleted');
          }
          console.log('deleted', deletedId);
        });
      });
    });
    return Promise.all(promises);
  });
});

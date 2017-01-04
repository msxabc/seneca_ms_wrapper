var _ = require('lodash');
var util = require('util');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;

var MsgEmitter = function() {
    var self = this;
};

util.inherits(MsgEmitter, EventEmitter);

MsgEmitter.prototype.waitForMsg = function(evtName, timeout) {
  var self = this;
  if(!timeout) {
    timeout = 10000;
  }
  return new Promise(function(resolve, reject) {
    var timer;
    function callback(data) {
      if(timer) {
        clearTimeout(timer);
      }

      resolve(data);
    }
    self.once(evtName, callback);
    timer = setTimeout(function() {
      // remove the listener
      self.removeListener(evtName, callback);
      reject(new Error('Message response '+ evtName +' timed out after ' + timeout + ' ms.'));
    }, timeout);
  });
};

module.exports = MsgEmitter;

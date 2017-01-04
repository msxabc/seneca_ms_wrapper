function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

// Given an array of settingPairs like:
//   [ { key: "path.to.key", value: value }, ...]
// convert to an object like this:
//  { path: { to: { key: value } } }
var keyPairsToObject = function(keyPairs, options) {
  var dropCount = options && options.drop || 0;
  var response = {};
  _(keyPairs).map(function(settingPair) {
    var keyPath = settingPair.key.split('.');
    var keySlot = _(keyPath).drop(dropCount).reduce(function(m, n) {
      var current = m.curr;
      var next = n;
      if (!isNaN(next)) {
        if (!isArray(current)) {
          m.prev[m.prevKey] = [];
          current = m.prev[m.prevKey];
        }
        if (typeof current[next] === 'object') {
          return {curr: current[next], prev: m.prev, prevKey: m.prevKey};
        }
      }
      if (!current.hasOwnProperty(next)) {
        current[next] = {};
      }
      return {curr: current[next], prev: current, prevKey: next};
    }, { curr: response, prev: null, prevKey:null});
    keySlot.prev[keyPath[keyPath.length-1]] = settingPair.value;
  }).toArray();
  return response;
};

var objectToKeyPairs = function(object, pathPrefix) {
  if (isArray(object)) {
    return _(object).map(function(m,index) {
      return objectToKeyPairs(m, pathPrefix.concat([index]));
    }).flatten().toArray();
  } else if (typeof object === "object") {
    return _(object).keys().map(function(m) {
      return objectToKeyPairs(object[m], pathPrefix.concat( [m]));
    }).flatten().toArray();
  } else {
    // Booleans should be integer values for helios
    if (object === true || object === false ) {
      object = object ? 1 : 0;
    }
    return { key: _(pathPrefix).join("."), value: object.toString() };
  }
};

module.exports = {
  objectToKeyPairs: objectToKeyPairs,
  keyPairsToObject: keyPairsToObject
};

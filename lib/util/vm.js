var fs = require('fs'),
    vm = require('vm'),
    path = require('path');

var extend = function(obj, props) {
  if (!props) return obj;
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      obj[p] = props[p];
    }
  }
  return obj;
};

var runInVm = function(cwd, filename, globals, options) {
  var opts = options || {};

  function requireFromCwd(id) {
    var isRelPath = (id.indexOf('.') === 0);
    if (isRelPath) {
      if (opts.sandboxRequire) {
        var absPath = path.resolve(cwd, id),
            newCwd = path.dirname(absPath),
            newFilename = path.basename(absPath);
        return runInVm(newCwd, newFilename, globals);
      } else {
        return require.main.require(path.resolve(cwd, id));
      }
    } else {
      return require.main.require(id);
    }
  }
  requireFromCwd.resolve = require.resolve;

  var filePath = path.resolve(cwd, filename);

  var sandbox = vm.createContext(extend({
    module: {},
    console: console,
    global: global,
    require: requireFromCwd,
    __dirname: cwd,
    __filename: filePath
  }, globals));

  var code = fs.readFileSync(require.resolve(filePath), 'utf8');
  var module = vm.runInContext(code, sandbox, { filename: filePath });

  return (module && module.exports) ? module.exports : module;
};

module.exports = runInVm;

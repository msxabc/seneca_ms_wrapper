var fsp = require('fs-promise'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    path = require('path');

var defaults = {
  log: {
    level: 'info',
    syslog: true
  },
  db: {
    name:"connect",
    host:"connect-db",
    port:27017
  },
  rabbit: {
    type: 'amqp',
    serverPin: {"role":"*", "cmd":"*"},
    clientPin: {"role":"*", "cmd":"*"},
    url: "amqp://guest:guest@connect-msgqueue:5672",
    exchange: {
      name: 'seneca-messages',
      options: {
        durable: true,
        autoDelete: false
      }
    },
    queues: {
      action: {
        prefix: 'seneca-messages',
        separator: '.',
        options: {
          durable: false,
          autoDelete: true
        }
      },
      response: {
        prefix: 'seneca-messages-response',
        separator: '.',
        options: {
          durable: false,
          autoDelete: true
        }
      }
    }
  },
  eventRabbit: {
    pin: {"role":"event", "cmd":"emit"},
    exchange: {
      type: 'fanout',
      name: 'seneca-events-',
      options: {
        durable: true,
        autoDelete: false
      }
    },
    queues: {
      action: {
        prefix: 'seneca-events-action-',
        separator: '.',
        options: {
          durable: false,
          autoDelete: true
        }
      },
      response: {
        prefix: 'seneca-event-response-',
        separator: '.',
        options: {
          durable: false,
          autoDelete: true
        }
      }
    }
  }
};

var allowedVars = ['HOME'];
var environment = {};
Object.keys(process.env)
.filter(function(k) {
  return allowedVars.indexOf(k) > -1 || k.indexOf('PMS_') === 0;
})
.forEach(function(k) {
  environment[k.replace(/^PMS_/, '')] = process.env[k];
});

function fileExists(path) {
  return fsp.access(path, fsp.R_OK)
  .then(function() {
    return true;
  })
  .catch(function() {
    return false;
  });
}

var loadFile = function (path) {
  return fileExists(path) // check if file is accessable
  .then(function(exists) {
    if(exists) {
      return fsp.readFile(path)
      .then(function(fileContent) {
        return JSON.parse(fileContent);
      })
      .catch(function(err) {
        err.message = 'Failed to parse ' + path + ': ' +err.message;
        throw new Error(err);
      });
    }
  });
};

var writeToFile = function(cfg, path) {
  return fsp.access(path, fsp.W_OK|fsp.R_OK)
  .then(function() {
    var filtered = _.omit(cfg, ["service", "HOME", "ENVIRONMENT"].concat(Object.keys(environment)));
    return fsp.writeFile(path, JSON.stringify(filtered, null, 2));
  })
  .catch(function() {
    // dont care whether the write failed
  });
};

function Config(configOverride) {
  this.config = configOverride;
}

Config.prototype.init = function() {
  return this.loadConfig();
};

Config.prototype.writeConfig = function(config) {
  var self = this;
  var localConfig = process.cwd()+"/config.json";
  var globalConfig = "/etc/connect/config.json";
  var promises = [];

  if (self.config.ENVIRONMENT !== "development") {
    promises.push(writeToFile(config, localConfig));
  }

  promises.push(writeToFile(config, globalConfig));

  return Promise.all(promises).then(function() {
    self.config = config;
    return self.config;
  });
};

Config.prototype.loadConfig = function() {
  var self = this;
  var serviceInfo = { service: Config.serviceInfo() };
  var systemConfig;
  return Promise.all([loadFile("/etc/connect/config.json"), loadFile(path.resolve(serviceInfo.service.root, "config.json"))])
  .then(function(fileContents) {
    self.config = _.merge({}, defaults, self.config, environment, _.get(fileContents, '[1]'), _.get(fileContents, '[0]'), serviceInfo);
  });
};

Config.serviceInfo = function() {
  var serviceRoot = process.cwd();
  var serviceFilename = path.basename(require.main.filename);

  var servicePackage, serviceName;
  try {
    servicePackage = require(path.resolve(serviceRoot, "package.json"));
    serviceName = servicePackage.name;
  } catch (e) {
    serviceName = serviceFilename.replace(/\.js$/, "");
  }
  return {
    root: serviceRoot,
    name: serviceName
  };
};

module.exports = Config;

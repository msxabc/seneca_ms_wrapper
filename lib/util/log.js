var winston = require('winston');
var glossy = require('glossy');
var util = require('util');
var _ = require('lodash');
var Syslog = require('winston-syslog').Syslog;
var os = require('os');

winston.emitErrs = true;

var facility = 'local0',
  pid = process.pid,
  producer = new glossy.Produce({
    pid: pid,
    facility: facility
  });

function syslogFormatter(options) {
  return producer.produce({
    severity: options.level,
    host: os.hostname(),
    date: new Date(),
    message: options.message
  });
}

var defaultTransport = {
  handleExceptions: false,
  json: false,
  formatter: syslogFormatter,
  level: 'info'
};


var logger = new(winston.Logger)({
  levels: winston.config.syslog.levels,
  exitOnError: true
});

var initialized = false;

logger.add(winston.transports.Console, defaultTransport);

logger.init = function(config) {
  if (!initialized) {
    initialized = true;
    var newLevel = _.get(config, 'log.level');
    var transportOptions = defaultTransport;
    producer.appName = _.get(config, 'service.name');
    logger.level = newLevel;
    transportOptions.level = newLevel;
    logger.remove(winston.transports.Console);
    logger.add(winston.transports.Console, transportOptions);
    var syslogOption = _.get(config, 'log.syslog');
    if(!_.isNull(syslogOption)) {
      var defaultSyslogOptions = {
        app_name: _.get(config, 'service.name'),
        protocol: 'udp4',
        localhost: os.hostname(),
        port: 514
      };
      logger.add(Syslog, _.isObject(syslogOption) ? syslogOption : defaultSyslogOptions);
    }
  }
};

logger.disableConsoleLogging = function() {

  try {
    logger.remove(winston.transports.File);
    logger.remove(winston.transports.Console);
  } catch (e) {
    // Console logging already disabled.
  }
};

function formatArgs(args) {
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

logger.overrideLogging = function(loggerObject) {
  loggerObject.log = function() {
    logger.info.apply(logger, formatArgs(arguments));
  };
  loggerObject.info = function() {
    logger.info.apply(logger, formatArgs(arguments));
  };
  loggerObject.warn = function() {
    logger.warning.apply(logger, formatArgs(arguments));
  };
  loggerObject.error = function() {
    logger.error.apply(logger, formatArgs(arguments));
  };
  loggerObject.debug = function() {
    logger.debug.apply(logger, formatArgs(arguments));
  };
  loggerObject.fatal = function() {
    logger.error.apply(logger, formatArgs(arguments));
  };
};

logger.overrideLogging(console);

module.exports = logger;

/*jshint node:true, unused: true, undef: true */

"use strict";

var DEBUG = 0, INFO = 1, LOG = 2, WARN = 3, ERROR = 4;

var logLevel = LOG;

module.exports = function(level) {
    if(typeof(level) === "string") {
        level = level.toUpperCase();
        
        if(typeof(module.exports[level]) !== "undefined") {
            level = module.exports[level];
        }
    } else if(typeof(level) === "undefined") {
        
        level = null;
    }
    
    this.logLevel = level;
};

module.exports.prototype = {
    getLogLevel: function() {
        if(this.logLevel === null) {
            return logLevel;
        }
        
        return this.logLevel;
    },
    setLogLevel: function(level) {
        this.logLevel = level;
    },
    error: function() {
        if(this.getLogLevel() > ERROR) return;
        doLog("error", arguments);
    },
    warn: function() {
        if(this.getLogLevel() > WARN) return;
        doLog("warn", arguments);
    },
    log: function() {
        if(this.getLogLevel() > LOG) return;
        doLog("log", arguments);
    },
    info: function() {
        if(this.getLogLevel() > INFO) return;
        doLog("info", arguments);
    },
    debug: function() {
        if(this.getLogLevel() > DEBUG) return;
        doLog("debug", arguments);
    }
};

function doLog(type, args) {
    var func = console.log;
    if(type == 'info') func = console.info;
    if(type == 'warn') func = console.warn;
    if(type == 'error') func= console.error;
    
    type = '[' + type.toUpperCase() + ']';
    while(type.length < 7) {
        type = ' ' + type;
    }
    
    Array.prototype.unshift.call(args, type);
    func.apply(console, args);
}
    
module.exports.setLogLevel = function(level) {
    logLevel = level;
};

module.exports.error = function() {
    if(logLevel > ERROR) return;
    doLog("error", arguments);
};

module.exports.warn = function() {
    if(logLevel > WARN) return;
    doLog("warn", arguments);
};

module.exports.log = function() {
    if(logLevel > LOG) return;
    doLog("log", arguments);
};

module.exports.info = function() {
    if(logLevel > INFO) return;
    doLog("info", arguments);
};

module.exports.debug = function() {
    if(logLevel > DEBUG) return;
    doLog("debug", arguments);
};

module.exports.DEBUG = DEBUG;
module.exports.INFO = INFO;
module.exports.LOG = LOG;
module.exports.WARN = WARN;
module.exports.ERROR = ERROR;
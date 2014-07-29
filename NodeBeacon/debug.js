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
        console.error.apply(console, arguments);
    },
    warn: function() {
        if(this.getLogLevel() > WARN) return;
        console.warn.apply(console, arguments);
    },
    log: function() {
        if(this.getLogLevel() > LOG) return;
        console.log.apply(console, arguments);
    },
    info: function() {
        if(this.getLogLevel() > INFO) return;
        console.info.apply(console, arguments);
    },
    debug: function() {
        if(this.getLogLevel() > DEBUG) return;
        console.log.apply(console, arguments);
    }
};


    
module.exports.setLogLevel = function(level) {
    logLevel = level;
};

module.exports.error = function() {
    if(logLevel > ERROR) return;
    console.error.apply(console, arguments);
};

module.exports.warn = function() {
    if(logLevel > WARN) return;
    console.warn.apply(console, arguments);
};

module.exports.log = function() {
    if(logLevel > LOG) return;
    console.log.apply(console, arguments);
};

module.exports.info = function() {
    if(logLevel > INFO) return;
    console.info.apply(console, arguments);
};

module.exports.debug = function() {
    if(logLevel > DEBUG) return;
    console.log.apply(console, arguments);
};

module.exports.DEBUG = DEBUG;
module.exports.INFO = INFO;
module.exports.LOG = LOG;
module.exports.WARN = WARN;
module.exports.ERROR = ERROR;
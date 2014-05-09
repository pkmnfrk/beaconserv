/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map");

module.exports = {
    get: function (req, res) {
        
        res.writeJson({
            supportsWebsockets: realtime_map.supportsWebsockets
        });
        
    }
};
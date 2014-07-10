/* jshint node:true */
"use strict";

var server = require("../server");

module.exports = {
    get: function (req, res) {

        res.writeJson({
            supportsWebsockets: server.supportsWebsockets,
            alive: true
        });
        
    }
};
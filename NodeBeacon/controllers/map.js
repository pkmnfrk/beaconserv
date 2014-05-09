/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map"),
    url = require("url");

module.exports = {
    get: function (req, res) {
        var path = url.parse(req.url).pathname.split('/');
        
        path.shift();
        path.shift();
        
        if(!path.length) {
            res.writeHead("404 Not Found");
            res.end();
            return;
        }
        
        switch(path[0]) {
            case "closeall":
                
                realtime_map.closeAllConnections();
                
                res.writeHead("204 No Content");
                res.end();
                
                return;
        }
        
        
        res.writeHead("404 Not Found");
        res.end();
        
    }
};
/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map"),
    url = require("url"),
    database = require("../database");

module.exports = {
    get: function (req, res) {
        var path = url.parse(req.url).pathname.split('/');
        
        path.shift();
        path.shift();
        
        if(!path.length) {
            res.writeHead(404, "Not Found");
            res.end();
            return;
        }
        
        switch(path[0]) {
            case "closeall":
                
                realtime_map.closeAllConnections();
                
                res.writeHead(204, "No Content");
                res.end();
                
                return;
            case "labels":
                database.getLabels(function(labels) {
                    res.writeJson(labels);
                });
                
                return;
        }
        
        
        res.writeHead(404, "Not Found");
        res.end();
        
    },
    
    post: function(req, res)
    {
        var path = url.parse(req.url).pathname.split('/');
        var data = '';
        
        
        path.shift();
        path.shift();
        
        if(!path.length) {
            res.writeHead(404, "Not Found");
            res.end();
            return;
        }
        
        switch(path[0]) {
            case "label":
                
                req.on('data', function(d) {
                    data += d;
                });
                req.on('end', function() {
                    data = JSON.parse(data);
                    
                    database.storeLabel(data, function(err) {
                        if(err)
                        {
                            console.log(err);
                            res.writeHead(500, "Internal Server Error");
                            res.end();
                            return;
                        }    
                        
                        res.writeHead(204, "No Content");
                        res.end();
                    });
                    
                });
                //req.finish();
                return;
        }
        
        
        res.writeHead(404, "Not Found");
        res.end();
        
    }
};
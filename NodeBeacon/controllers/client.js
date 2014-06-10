/* jshint node:true */

"use strict";

var url = require("url"),
    database = require("../database"),
    realtime_map = require("../realtime_map"),
    multiparty = require("multiparty"),
    fs = require("fs"),
    qs = require("querystring");

module.exports = {
    get: function(request, response) {
    
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/');
        
        path.shift();
        path.shift();
        
        console.log(path);
        
        if(!path.length) {
            response.writeHead(404, "Not Found!");
            response.end();
            return;
        }
        
        if(path[0] === "my") {
            if(path[1] === "name") {
                database.findClient(request.clientid, function(c) {
                    response.writeJson(c.name);
                    return;
                });
                
                return;
            }
        }
        
        response.writeHead(404, "Not Found?");
        response.end();
        return;

    },
    
    put: function(request, response) {
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/').slice(2);
        
        if(!path.length) {
            response.writeHead(404, "Not Found");
            response.end();
            return;
        }
        
        if(path[0] === "my") {
            if(path[1] === "name") {
                database.findClient(request.clientid, function(c) {
                    var body = "";
                    
                    request.on("data", function(d) {
                        body += d;
                        if(body.length > 1e6) {
                            request.connection.destroy();
                        }
                    });
                    request.on("end", function(){ 
                        var data = qs.parse(body);
                        
                        //console.log(data.name);
                        
                        c.name = data.name;
                        
                        database.storeClient(c, function() {
                            response.writeHead(204, "No Content");
                            response.end();    
                        });
                        
                    
                    });
                    
                    
                    return;
                });
                
                return;
            }
        }
        
        response.writeHead(404, "Not Found");
        response.end();
        return;
    }
};
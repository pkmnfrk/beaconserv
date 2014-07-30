/* jshint node:true */

"use strict";

var url = require("url"),
    database = require("../database"),
    realtime_map = require("../realtime_map"),
    multiparty = require("multiparty"),
    fs = require("fs"),
    qs = require("querystring"),
    debug = new (require("../debug"))("DEBUG");

module.exports = {
    get: function(request, response) {
    
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/');
        
        path.shift();
        path.shift();
        
        debug.info(path);
        
        if(!path.length) {
            response.writeHead(404, "Not Found!");
            response.end();
            return;
        }
        
        if(path[0] === "me") {
            database.findClient(request.clientid, function(c) {
                response.writeJson(c);
                return;
            });

            return;
            
        } else if (path[0] === "all") {
            database.findClients(function(err, clients) {
                if(err) {
                    response.writeError(err);
                    return;
                }
                response.writeJson(clients);
                return;
            });
            
            return;
        } else if (path[0] === "most") {
            database.findClients({
                pings: {
                    "$elemMatch": {
                        date: {
                            "$gt": new Date().addMinutes(-10)
                        }
                    }
                }
            }, function(err, clients) {
                if(err) {
                    response.writeError(err);
                    return;
                }
                response.writeJson(clients);
                return;
            });
            
            return;
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
        
        if(path[0] === "me") {
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
                        
                        
                        debug.debug(body);
                        debug.log("Setting client name to ", data.name);
                        
                        if(!data || !data.name) {
                            response.writeError({error:"Must specify a name"});
                            response.end();
                            return;
                        }
                        
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
            
            response.writeHead(401, "Not Authorized");
            response.end();
            return;
        }
        
        response.writeHead(404, "Not Found");
        response.end();
        return;
    }
};
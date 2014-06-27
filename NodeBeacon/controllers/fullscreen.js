/* jshint node:true */

"use strict";

var url = require("url"),
    database = require("../database"),
    fullscreen_display = require("../fullscreen_display");

module.exports = {
    get: function(request, response) {
        
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/');
        
        path.shift();
        path.shift();
        
        if(path[0] === "config") {
            database.getFullscreenConfig(function(config) {
                if(path[1]) {
                    if(config.hasOwnProperty(path[1])) {
                        response.writeJson(config[path[1]]);
                        return;
                    }
                    
                    response.writeHead(404, "Not Found");
                    return;
                }
                
               response.writeJson(config); 
            });
        }
        
    },
    
    put: function(request, response) {
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/');
        
        path.shift();
        path.shift();
        
        var id = path[0];
        
        if(!id) {
            response.writeHead(404, "Not Found");
            response.end();
            return;
        }
        
        var data = "";
        
        request.on("data", function (d) {
            data += d;
        }).on("end", function() {
            
            data = JSON.parse(data);
            
            database.getFullscreenConfig(function(config) {
            
                if(path[1] === "current") {
                    
                    config[id].name = data.name;
                    config[id].url = data.url;
                    
                } else if(path[1] === "schedule") {
                    config[id].schedule = data;
                    
                } else if(!path[1]) {
                    config[id] = data;
                }
                
                database.putFullscreenConfig(config, function() {
                    //notify screens
                    fullscreen_display.notifyChange(id, config[id]);
                    
                    response.writeHead(204, "No Content");
                    response.end();
                    return;
                });
                
            });
            
        });
    },
    
    post: function(request, response) {
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/');
        
        path.shift();
        path.shift();
        
        if(path[0] === "refresh") {
            
            fullscreen_display.notifyRefresh(path[1]);
            
            response.writeHead(204, "No Content");
            response.end();
            return;
            
        }
    }
    
};
/* jshint node:true */

"use strict";

var url = require("url");

var _staticHandler = null;
var modules = {};

function route(handle, request, response) {
    var pathname = url.parse(request.url).pathname;
    //console.log("About to route a request for " + pathname);
    
    var handler = null;
    
    var parts = pathname.substring(1).split("/");
    
    if(parts[0]) {
        //maybe we have a controller?
        var modName = parts[0].toLowerCase();
        
        //console.log("Trying to load " + modName);
        
        if(modName in modules) {
            //console.log("Found cached controller for " + modName);
            handler = modules[modName];
        } else {
            //console.log("No cached controller for " + modName);
            //maybe try loading it?
            try {
                handler = require("./controllers/" + modName);
                //console.log("Found controller file for " + modName);
            } catch(e) {
                console.log("Error loading controller file for " + modName);
                console.log(e);
            }
            //whether successful or otherwise, cache the result
            modules[modName] = handler;
        }
    }
    
    if(handler) {
        //oh, good
        //let's check to see if the support the current method
        
        if(request.method.toLowerCase() in handler) {
            handler = handler[request.method.toLowerCase()];
        } else {
            //let's bomb out with an error
            var methods = [], i;
            for(i in handler) {
                if(handler.hasOwnProperty(i) && typeof(handler[i]) === "function") {
                    methods.push(i.toUpperCase());
                }
            }
            console.log("Invalid request method for " + pathname);
            response.writeHead("405 Method Not Allowed", {
                "Allow": methods.join(", ")
            });
            response.write("405 Method Not Allowed");
            response.end();
            return;
        }
    }   
    
    /*for(var h in handle) {
        console.log("Handler: " + h + ", " + handle[h]);
    }*/
    
    if(handler === null) {
        for(var h in handle) {
           if(!handle[h].r) {
                handle[h].r = new RegExp(h, "i");
           }

            if(handle[h].r.test(pathname)) {
                handler = handle[h];
                break;
            }
        }
    }
    
    if(handler) {
        handler(request, response);
    } else {
        if(_staticHandler) {
            _staticHandler(request, response);
        } else {
            console.log("No request handler found for " + pathname);
            response.writeHead("404 Not Found");
            response.write("404 Not Found");
            response.end();
        }
    }
}

function setStaticHandler(staticHandler) {
    if(typeof staticHandler !== "function")
        throw "Not a function";
    
    _staticHandler = staticHandler;
}

exports.route = route;
exports.setStaticHandler = setStaticHandler;
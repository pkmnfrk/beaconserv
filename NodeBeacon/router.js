/* jshint node:true */

"use strict";

var url = require("url"),
    debug = new (require("./debug"))("INFO"),
    fs = require("fs");

var _staticHandler = null;
var modules = {};

function route(handle, request, response) {
    var pathname = url.parse(request.url).pathname;
    debug.info("About to route a request for " + pathname);
    
    var handler = null;
    
    var parts = pathname.substring(1).split("/");
    
    if(parts[0]) {
        
        //maybe we have a controller?
        var modName = parts[0].toLowerCase();
        
        debug.info("Trying to load " + modName);
        
        if(modName in modules) {
            debug.info("Found cached controller for " + modName);
            handler = modules[modName];
        } else {
            debug.info("No cached controller for " + modName);
            //maybe try loading it?
            if(fs.existsSync("./controllers/" + modName + ".js")) {
                try {
                    handler = require("./controllers/" + modName);
                    debug.info("Found controller file for " + modName);
                } catch(e) {
                    debug.error("Error loading controller file for " + modName, e);

                }
            } else {
                debug.info("No controller for " + modName);
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
            debug.log("Invalid request method for " + pathname);
            response.writeHead("405 Method Not Allowed", {
                "Allow": methods.join(", ")
            });
            response.write("405 Method Not Allowed");
            response.end();
            return;
        }
    }   
    var h;
    
    for(h in handle) {
        debug.debug("Handler: " + h + ", " + handle[h]);
    }
    
    if(handler === null) {
        for(h in handle) {
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
            debug.info("No request handler found for " + pathname);
            response.writeHead("404 Not Found");
            response.write("404 Not Found");
            response.end();
        }
    }
}

function setStaticHandler(staticHandler) {
    if(typeof staticHandler !== "function") {
        debug.error("Invalid static handler passed in");
        console.trace("Invalid handler source");
        return;
    }
    
    _staticHandler = staticHandler;
}

exports.route = route;
exports.setStaticHandler = setStaticHandler;
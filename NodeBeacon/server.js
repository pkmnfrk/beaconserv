/*jshint node:true, unused: true, undef: true */

"use strict";

require("./polyfills");

var http = require("http"),
    uuid = require("node-uuid"),
    os = require("os"),
    Cookies = require("cookies");

var server = null;

http.ServerResponse.prototype.writeJson = function(obj, headers) {
    var my_headers = { 
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=0, no-cache" //assume, by default, that JSON responses are APIs without caching
    };
    for(var k in headers) {
        my_headers[k] = headers[k];
    }
    this.writeHead(200, my_headers);
    this.write(JSON.stringify(obj));
    this.end();
};

http.ServerResponse.prototype.writeError = function(obj, headers) {
    var my_headers = { "Content-Type": "application/json" };
    for(var k in headers) {
        my_headers[k] = headers[k];
    }
    this.writeHead(500, my_headers);
    this.write(JSON.stringify(obj));
    this.end();
};

function start(route, handle) {
    server = http.createServer(function (request, response) {
        
        request.cookies = response.cookies = new Cookies(request, response);
        
        request.clientid = request.cookies.get("ClientID");
        
        if(!request.clientid) {
            request.clientid = uuid.v4();
            response.cookies.set("ClientID", request.clientid, { httpOnly: true, expires: new Date().addDays(365) });
        }
        
        route(handle, request, response);
        
        
    });
    
    var port = process.env.PORT;
    
    if(!port) port = 8081;
    
    server.listen(port);
    
    
    console.log("Server started");
}

function getServer() {
    return server;   
}

exports.start = start;
exports.getServer = getServer;

exports.supportsWebsockets = (function() { 
    if(process.env.IISNODE_VERSION) { //running under iisnode == restricted by IIS version
        console.log("IIS detected, but what version?");
        if(os.release() < "6.2") {
            console.log("Detected IIS <= 7, so disabling websocket support");
            return false;
        } else {
            console.log("Detected IIS > 7, so enabling websocket support");
        }
    } else {
        console.log("No IIS so enabling websocket support");
    }
    
    return true;
})();
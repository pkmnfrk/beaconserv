"use strict";

require("./polyfills");

var http = require("http"),
    url = require("url"),
    uuid = require("node-uuid"),
    os = require("os"),
    Cookies = require("cookies");

var server = null, socketServer = null;

http.ServerResponse.prototype.writeJson = function(obj) {
    this.writeHead(200, { "Content-Type":"application/json" });
    this.write(JSON.stringify(obj));
    this.end();
};

http.ServerResponse.prototype.writeError = function(obj) {
    this.writeHead(500, { "Content-Type":"application/json" });
    this.write(JSON.stringify(obj));
    this.end();
};

function start(route, handle) {
    server = http.createServer(function (request, response) {
        var postData = "";
        //var pathname = url.parse(request.url).pathname;
        //console.log("Request received for " + pathname);
        
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
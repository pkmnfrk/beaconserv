"use strict";

var http = require("http"),
    url = require("url");

var server = null, socketServer = null;


function start(route, handle) {
    server = http.createServer(function (request, response) {
        var postData = ""
        //var pathname = url.parse(request.url).pathname;
        //console.log("Request received for " + pathname);
        
        route(handle, request, response);
        
        /*
        request.setEncoding("utf8");
        
        request.addListener("data", function(postDataChunk) {
            postData += postDataChunk;
            console.log("Received post data chunk '" + postDataChunk + "'");
        });
        
        request.addListener("end", function() {
            route(handle, pathname, response, postData);
        });
        */
        
    });
    
    var port = process.env.PORT;
    
    if(!port) port = 8888;
    
    server.listen(port);
    
    
    console.log("Server started");
}

function getServer() {
    return server;   
}

exports.start = start;
exports.getServer = getServer;
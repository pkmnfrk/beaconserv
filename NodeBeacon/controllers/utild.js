/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map");
var url = require("url"),
    fs = require("fs"),
    qs = require("querystring");


module.exports = {
    post: function (request, response) {
        
        var path = url.parse(request.url).pathname.split('/');
        var body = "";
        
        path.shift();
        path.shift();
        
        if(path[0] == "football") {
            
            request.on("data", function(d) {
                body += d;
                if(body.length > 1e6) {
                    request.connection.destroy();
                }
            });
            request.on("end", function(){ 
                var data = qs.parse(body);

                
                fs.readFile("static/util/football.json", function(error, json) {
                    console.log(json);
                    
                    json = JSON.parse(json);
                    console.log(json);
                    
                    for(var key in data) {
                        if(data.hasOwnProperty(key)) {
                            json[key] = data[key];
                        }
                    }
                    
                    json = JSON.stringify(json);
                    
                    fs.writeFile("static/util/football.json", json, function() {
                        response.writeHead(301, "Moved Permanently", { "Location": "/util/footballAdmin.html" });
                        response.end();
                        
                    });
                });
                


            });
            
            
            return;
            
        }
    }
};
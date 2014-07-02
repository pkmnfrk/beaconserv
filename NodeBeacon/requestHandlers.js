var url = require("url"),
    querystring = require("querystring"),
    statics = require("node-static"),
    database = require("./database"),
    staticServer = new statics.Server('./static', {
        cache: false,
        headers: {
            "Cache-Control": "none"
        }
    }),
    realtime_map = require("./realtime_map");

exports.static = function staticHandler(request, response, file) {
    
    request.addListener("end", function () {
        if (file) {
            staticServer.serveFile(file, 200, {}, request, response);
        } else {
            staticServer.serve(request, response, function(e, res) {
                if(e && (e.status === 404)) {
                    //console.log(e);
                    if(request.url.indexOf("/Content/maps/") === 0) {
                        staticServer.serveFile("Content/maps/blank.png", 200, {"Content-Type":"image/png"}, request, response);
                    } else {
                        response.writeHead(e.status, e.headers);
                        response.end();
                    }
                }
            });
        }
    }).resume();
    
};

exports.client = function client(request, response) {
    database.findClient(request.clientid, function(client) {
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(client));
        response.end();
    });
};

exports.state = function state(request, response) {
    database.findClient(request.clientid, function (client) {
        
        var pings = client.pings.slice(0, 5);
        var ret = [];
        
        var func = function () {
            if(pings.length) {
                var ping = pings.shift();
                
                database.findBeaconById(ping.beacon_id, function(beacon) {
                    ret.push(beacon);
                    
                    func();
                });
                    
                    
            } else {
                response.writeHead(200, {"Content-Type": "application/json" });
                response.write(JSON.stringify(ret));
                response.end();
            }
        };
        
        func();
        
    });
};
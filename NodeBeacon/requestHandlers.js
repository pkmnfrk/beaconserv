var url = require("url"),
    querystring = require("querystring"),
    statics = require("node-static"),
    database = require("./database"),
    staticServer = new statics.Server('./static', {
        cache: false //I manually add caching headers down below
    }),
    realtime_map = require("./realtime_map");

var superStaticPaths = [
    "/Content/maps/",
    "/Content/images/"
];

function isSuperStatic(path) {
    for(var i = 0; i < superStaticPaths.length; i++){
        if(path.indexOf(superStaticPaths[i] === 0))
            return true;
    }
    
    return false;
}

exports.static = function staticHandler(request, response, file) {
    
    request.addListener("end", function () {
        if (file) {
            staticServer.serveFile(file, 200, {}, request, response);
        } else {
            if(isSuperStatic(request.url)) {
                staticServer.options.headers['Cache-Control'] = 'public, max-age=86400';
            } else {
                staticServer.options.headers['Cache-Control'] = 'max-age=60';
            }
            
            staticServer.serve(request, response, function(e, res) {
                if(e && (e.status === 404)) {
                    //console.log(e);
                    if(isSuperStatic(request.url)) {
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
    database.findClient(request.clientid, function(err, client) {
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(client));
        response.end();
    });
};

exports.state = function state(request, response) {
    database.findClient(request.clientid, function (err, client) {
        
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
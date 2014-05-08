var url = require("url"),
    querystring = require("querystring"),
    static = require("node-static"),
    database = require("./database"),
    staticServer = new static.Server('./static'),
    realtime_map = require("./realtime_map")

function staticHandler (request, response, file) {
    
    request.addListener("end", function () {
        if(file) {
            staticServer.serveFile(file, 200, {}, request, response);
        } else {
            staticServer.serve(request, response);
        }
    }).resume();
    
}

function beacons (request, response) {
    //console.log("beacons!");
    
    var path = url.parse(request.url).pathname.split('/');
    
    var uuid = undefined, major = undefined, minor = undefined;
    
    //remove "" and "beacon", respectively
    
    path.shift();
    path.shift();
    
    if(path.length >= 1) {
        uuid = path[0];
        if(path.length >= 2) {
            major = parseInt(path[1], 10);
            if(path.length >= 3) {
                minor = parseInt(path[2], 10);
            }
        }
    }
    
    console.log(uuid + " " + major + " " + minor);

    database.findBeacon(uuid, major, minor, function(err, docs) {
        
        if(err) {
            response.writeHead("500 Internal Server Error");
            reponse.write(JSON.stringify(err));
            response.end();
            return;
        }
        
        response.writeHead(200, {"Content-Type": "application/json"});
        
        response.write(JSON.stringify(docs));
        response.end();
    });
}

function ping(request, response) {
    var path = url.parse(request.url).pathname.split('/');
    
    var uuid = undefined, major = undefined, minor = undefined;
    
    //remove "" and "ping", respectively
    
    path.shift();
    path.shift();
    
    if(path.length != 3) {
        response.writeHead("404 Not Found");
        response.end();
        return;
    }
    
    uuid = path[0];
    major = parseInt(path[1], 10);
    minor = parseInt(path[2], 10);
    
    database.findClient(request.clientid, function (client) {
    
        database.findBeacon(uuid, major, minor, function(err, docs) {
            if(docs.length == 0) return;

            console.log("Found beacon");


            var beacon = docs[0];

            var ping = {
                date: new Date(),
                beacon_id: beacon._id
            };
            
            console.log(client);
            
            client.pings.unshift(ping);
        
            database.storeClient(client);
        
            realtime_map.notifyPing(uuid, major, minor, request.clientid, "insert name here");

            response.writeHead(200, {"Content-Type": "application/json"});

            response.write(JSON.stringify(beacon));
            response.end();

        });
    });
}

exports.static = staticHandler;
exports.beacons = beacons;
exports.ping = ping;
exports.client = function client(request, response) {
    database.findClient(request.clientid, function(client) {
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(client));
        response.end();
    });
};
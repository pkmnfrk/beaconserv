/*jshint node:true, unused: true, undef: true */

"use strict";

var server = require("./server"),
    database = require("./database"),
    uuid = require("node-uuid"),
    WebSocketServer = require("ws").Server,
    socketServer = null,
    debug = require("./debug");



var onInitialMessage = function (msg) {
    var self = this;
    
    debug.info("Got initial message from client: " + msg);
    
    msg = JSON.parse(msg);
    if(msg.ok) {
        this.removeListener("message", this.handler);
        this.handler = onMessage.bind(this);
        this.on("message", onMessage);
        
        //now, let's update them on the current state
        database.findClients({
            pings: {
                "$elemMatch": {
                    date: {
                        "$gt": new Date().addDays(-1)
                    }
                }
            }
        }, function(err, clients) {
            debug.debug("Clients: ", clients);
            
            var client;
            
            while(clients.length) {
                client = clients.shift();
                if(client.pings.length) break;
            }
            
            if(client) {
                database.findBeaconById(client.pings[0].beacon_id, function receiveBeacon(beacon) {
                    debug.info("Loaded beacon for client " + client.clientid);
                    if(beacon) {
                        var msg = getBeaconNotifyMessage(client, beacon);

                        self.send(JSON.stringify(msg));
                    }

                    while(clients.length) {
                        client = clients.shift();
                        if(client.pings.length) {
                            database.findBeaconById(client.beacon_id, receiveBeacon);
                            break;
                        }
                    }
                });
            }
            
        });
        
    } else {
        this.close();
    }
};



var onMessage = function (msg) {
    msg = msg;
};

function start() {
    
    //debug.info(process.env);
    
    if(!server.supportsWebsockets) return;
    
    socketServer = new WebSocketServer({
        server: server.getServer(),
        path: "/socket"
    }).on("connection", function(ws) {
        debug.info("Connection");

        ws.uuid = uuid.v4();

        ws.handler = onInitialMessage.bind(ws);
        ws.on("message", ws.handler);

        ws.send(JSON.stringify({
            identifier: ws.uuid
        }));

    });
    
    socketServer.broadcast = function(data) {
        for(var i in this.clients)
            this.clients[i].send(data);
    };

}
    
exports.start = start;
exports.notifyPing = function(client, beacon) {
    if(!server.supportsWebsockets) return;
    
    var msg = getBeaconNotifyMessage(client, beacon);
    
    //debug.info("Broadcasting msg abount client " + clientid);
    
    socketServer.broadcast(JSON.stringify(msg));
};

function getBeaconNotifyMessage(client, beacon) {
    return {
        msg: "client",
        uuid: beacon ? beacon.uuid : null,
        major: beacon ? beacon.major : null,
        minor: beacon ? beacon.minor : null,
        clientid: client.clientid,
        name: client.name,
        latitude: beacon ? beacon.latitude : null,
        longitude: beacon ? beacon.longitude : null
        
    };
}

exports.notifyBeaconChange = function(beacon) {
    if(!server.supportsWebsockets) return;
    
    //if(beacon === null) throw "Beacon cannot be null";
    
    var msg = {
        msg: "beacon",
        beacon: beacon
    };
    
    debug.info("Broadcasting beacon change about beacon " + beacon.major + ", " + beacon.minor);
    
    socketServer.broadcast(JSON.stringify(msg));
};

exports.notifyMarkerChange = function(marker) {
    if(!server.supportsWebsockets) return;
    
    if(marker === null) throw "Marker cannot be null";
    
    var msg = {
        msg: "marker",
        marker: marker
    };
    
    debug.info("Broadcasting marker change about marker " + marker._id);
    
    socketServer.broadcast(JSON.stringify(msg));
};

exports.notifyMarkerDeleted = function(marker_id) {
    if(!server.supportsWebsockets) return;
    
    if(marker_id === null) throw "Marker ID cannot be null";
    
    var msg = {
        msg: "marker_deleted",
        marker_id: marker_id
    };
    
    debug.info("Broadcasting marker deletion about marker " + marker_id);
    
    socketServer.broadcast(JSON.stringify(msg));
};


exports.closeAllConnections = function () {
    if(!server.supportsWebsockets) return;
    
    for(var i = 0; i < socketServer.clients.length; i++) {
        var c = socketServer.clients[i];
        c.close();
    }
};
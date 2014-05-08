var server = require("./server"),
    database = require("./database"),
    uuid = require("node-uuid"),
    WebSocketServer = require("ws").Server,
    socketServer = null;



var onInitialMessage = function (msg) {
    var self = this;
    
    console.log("Got initial message from client: " + msg);
    
    msg = JSON.parse(msg);
    if(msg.ok) {
        this.removeListener("on", this.handler);
        this.handler = onMessage.bind(this);
        this.on("onMessage", onMessage);
        
        //now, let's update them on the current state
        database.findClients({
            pings: {
                "$elemMatch": {
                    date: {
                        "$gt": new Date().addDays(-1)
                    }
                }
            }
        }, function(clients) {
            console.log("Clients:");
            console.log(clients);
            
            var client;
            
            while(clients.length) {
                client = clients.shift();
                if(client.pings.length) break;
            }
            database.findBeaconById(client.pings[0].beacon_id, function receiveBeacon(beacon) {
                console.log("Loaded beacon for client");
                if(beacon) {
                    var msg = {
                        msg: "client",
                        uuid: beacon.uuid,
                        major: beacon.major,
                        minor: beacon.minor,
                        clientid: client.clientid,
                        name: client.name
                    }

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
            
        })
        
    } else {
        this.close();
    }
}



var onMessage = function (msg) {
    
}

function start() {

    socketServer = new WebSocketServer({
        server: server.getServer(),
        path: "/socket"
    }).on("connection", function(ws) {
        console.log("Connection");

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
exports.notifyPing = function(uuid, major, minor, clientid, name) {
    var msg = {
        msg: "client",
        uuid: uuid,
        major: major,
        minor: minor,
        clientid: clientid,
        name: name
    };
    
    console.log("Broadcasting msg");
    
    socketServer.broadcast(JSON.stringify(msg));
}
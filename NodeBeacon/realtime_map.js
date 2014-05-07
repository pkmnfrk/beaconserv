var server = require("./server"),
    database = require("./database"),
    uuid = require("node-uuid"),
    WebSocketServer = require("ws").Server;

var onInitialMessage = function (msg) {
    console.log("Got initial message from client: " + msg);
    
    msg = JSON.parse(msg);
    if(msg.ok) {
        this.removeListener("on", this.handler);
        this.handler = onMessage.bind(this);
        this.on("onMessage", onMessage);
    } else {
        this.close();
    }
}



var onMessage = function (msg) {
    
}

function start() {

    var socketServer = new WebSocketServer({
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

}
    
exports.start = start;
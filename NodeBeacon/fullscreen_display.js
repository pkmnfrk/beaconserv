var server = require("./server"),
    database = require("./database"),
    WebSocketServer = require("ws").Server,
    socketServer = null;



var onInitialMessage = function (msg) {
    var self = this;
    
    console.log("Got initial message from client: " + msg);
    
    msg = JSON.parse(msg);
    if(msg.name) {
        this.removeListener("message", this.handler);
        this.handler = onMessage.bind(this);
        this.on("message", onMessage);
        
        self.name = msg.name;
        
        console.log("Client's name is " + self.name);
        
        database.getFullscreenConfig(function(config) {
            if(config[self.name]) {
                console.log("Notifying about configured screen");
                exports.notifyChange(self.name, config[self.name]);
            } else {
                console.log("Unknown screen");
                exports.notifyChange(self.name, {url: "about:blank" });
            }
        });
        
    } else if(msg.ping) { 
        //rock on
    } else {
        this.close();
    }
};



var onMessage = function (msg) {
    
};

var parseTime = function parseTime(t) {
    
    var time = t.match(/(\d+)(?::(\d\d))?\s*(p?)/);
    if(!time) return parseTime("00:00");
    var d = new Date();
    var h = parseInt(time[1], 10) + (time[3] ? 12 : 0);
    var m = parseInt(time[2], 10) || 0;
    
    if(h == 24) h = 12;
    
    d.setDate(1);
    d.setMonth(1);
    d.setFullYear(2000);
    d.setSeconds(0);
    
    d.setHours( h );
    d.setMinutes( m );
    
    return d;
};

var beginningOfDay = parseTime("00:00");

var checkSchedules = function() {
    
    database.getFullscreenConfig(function(config) {
        
        var now = new Date();
        now.setDate(1);
        now.setMonth(1);
        now.setFullYear(2000);
        now.setSeconds(0);
        
        var any = false;
        
        for(var id in config) {
            if(config.hasOwnProperty(id)) {
                
                var screen = config[id];
                
                if(!screen.schedule) continue;
                
                if(!screen.lastScheduleUpdate || now < screen.lastScheduleUpdate) {
                    screen.lastScheduleUpdate = beginningOfDay;
                }
                
                var sche = null;
                
                for(var i = 0; i < screen.schedule.length; i++) {
                    sche = screen.schedule[i];
                    var t = parseTime(sche.time);
                    
                    if(t >= screen.lastScheduleUpdate && t <= now) {
                        break;
                    }
                    sche = null;
                }

                screen.lastScheduleUpdate = now;
                
                if(sche && screen.name != sche.name && screen.url != sche.url) {
                    screen.name = sche.name;
                    screen.url = sche.url;
                    
                    exports.notifyChange(id, screen);
                    
                    any = true;
                    
                }
                
            }
        }

        if(any) {
            database.putFullscreenConfig(config, function() {
               //?? 

            });
        }
        
        setTimeout(checkSchedules, 60000);
        
    });
    
};

function start() {
    
    //console.log(process.env);
    
    if(!server.supportsWebsockets) return;
    
    checkSchedules();
    
    socketServer = new WebSocketServer({
        server: server.getServer(),
        path: "/display"
    }).on("connection", function(ws) {
        console.log("Connection");

        ws.handler = onInitialMessage.bind(ws);
        ws.on("message", ws.handler);

        ws.send(JSON.stringify({hello:true}));
    });
    
    socketServer.broadcast = function(data) {
        for(var i in this.clients)
            this.clients[i].send(data);
    };

}
    
exports.start = start;


exports.notifyChange = function(screen, data) {
    if(!server.supportsWebsockets) return;
    
    var msg = {
        msg: "change",
        data: data
    };
    
    msg = JSON.stringify(msg);
    console.log("Broadcasting fullscreen change");
    
    for(var i in socketServer.clients) {
        if(socketServer.clients[i].name === screen) {
            console.log("Notifying " + screen + " about " + JSON.stringify(data));
            socketServer.clients[i].send(msg);
        } else {
            
            console.log("Skipping screen " + socketServer.clients[i].name);
        }
    }
    
};

exports.notifyRefresh = function(screen) {
    
    var msg = {
        msg: "refresh"
    };
    
    msg = JSON.stringify(msg);
    
    for(var i in socketServer.clients) {
        var c = socketServer.clients[i];
        if(!screen || screen === c.name) {
            c.send(msg);
        }
    }
};

exports.closeAllConnections = function () {
    if(!server.supportsWebsockets) return;
    
    for(var i = 0; i < socketServer.clients.length; i++) {
        var c = socketServer.clients[i];
        c.close();
    }
};
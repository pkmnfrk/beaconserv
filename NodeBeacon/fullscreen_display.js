/*jshint node:true, unused: true, undef: true */

"use strict";

var server = require("./server"),
    database = require("./database"),
    WebSocketServer = require("ws").Server,
    socketServer = null,
    fs = require("fs"),
    debug = require("./debug");



var onInitialMessage = function (msg) {
    var self = this;
    
    debug.info("Got initial message from client: " + msg);
    
    msg = JSON.parse(msg);
    if(msg.name) {
        this.removeListener("message", this.handler);
        this.handler = onMessage.bind(this);
        this.on("message", onMessage);
        
        self.name = msg.name;
        
        debug.info("Client's name is " + self.name);
        
        database.getFullscreenConfig(function(err, config) {
            if(err) {
                exports.notifyChange(self.name, {url: "about:blank" });
                return;
            }
            
            if(config[self.name]) {
                debug.info("Notifying about configured screen");
                exports.notifyChange(self.name, config[self.name]);
            } else {
                debug.log("Unknown screen " + self.name);
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
    //debug.log(msg);
    msg = JSON.parse(msg);
    
    if(msg.msg === "log") {
        var today = new Date();
        today = today.getFullYear() + "-" + (today.getMonth() < 10 ? "0" : "") + today.getMonth() + "-" + (today.getDay() < 10 ? "0" : "") + today.getDay();
        
        var filename = 'static/logs/' + today + '-' + this.name + '.log';

        var line = "{date} - {text}\n";
        line = line.replace("{date}", new Date().toISOString()).replace("{text}", msg.text);

        fs.appendFile(filename, line, function() {
            //don't care about the result
        });
        
    }
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
    
    database.getFullscreenConfig(function(err, config) {
        
        if(err) {
            debug.error("Unable to load configuration data");
            return;
        }
        
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
    
    //debug.log(process.env);
    
    if(!server.supportsWebsockets) return;
    
    checkSchedules();
    
    socketServer = new WebSocketServer({
        server: server.getServer(),
        path: "/display"
    }).on("connection", function(ws) {
        debug.log("Connection");

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
    debug.info("Broadcasting fullscreen change");
    
    for(var i in socketServer.clients) {
        if(socketServer.clients[i].name === screen) {
            debug.info("Notifying " + screen + " about " + JSON.stringify(data));
            socketServer.clients[i].send(msg);
        } else {
            
            debug.debug("Skipping screen " + socketServer.clients[i].name);
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
Display.Websocket = L.Class.extend({
    options: {
       watchdogInterval: 15

    },
    includes: [
        L.Mixin.Events  
    ],
    initialize: function() {
        
        var loc = window.location, new_uri;
        if (loc.protocol === "https:") {
            new_uri = "wss:";
        } else {
            new_uri = "ws:";
        }
        new_uri += "//" + loc.host;
        new_uri += "/socket";
        
        this._uri = new_uri;
        
        this._id = null;
        this._phase = 0;
        
        this._watchdog = null;
        this._deathtimer = null;
        this._userclose = false;
        
        this.deathBackoff = 0;
    },
    
    open: function() {
        
        this._id = null;
        this._phase = 0;
        
        this._socket = new WebSocket(this._uri);
        
        this._socket.onopen = this._onOpen.bind(this);
        
        
        
    },
    
    close: function() {
        this._userclose = true;
        if(this._watchdog) {
            clearInterval(this._watchdog);
            this._watchdog = null;
            
        }
        this._socket.onclose = null;
        if(this._socket.readyState <= 1) {
            this._socket.close();
        }
    },
    
    _onOpen: function() {
        this._userclose = false;
        if(this._deathtimer) {
            clearInterval(this._deathtimer);
            this._deathtimer = null;
            this.deathBackoff = 0;
        }
        
        this._watchdog = setInterval(this._watchdog_fire.bind(this), this.options.watchdogInterval * 1000);
        
        this._socket.onclose = this._onClose.bind(this);
        this._socket.onerror = this._onClose.bind(this);
        this._socket.onmessage = this._onMessage.bind(this);
    },
    
    _onClose: function() {
        if(this._watchdog) {
            clearInterval(this._watchdog);
            this._watchdog = null;
            
        }
        
        this.close();
        
        var self = this;
        if(!this._userclose) {
            this._deathtimer = setInterval(function() {
                this.deathBackoff += 500;
                this.deathBackoff *= 1.2;
                self.open();
            }, 5000 + this.deathBackoff);
        }
        
    },
    
    _onMessage: function (msg) {
        
        var data = JSON.parse(msg.data);
        switch (this._phase) {
            case 0: //waiting for identifier
                this._id = data.identifier;
                this._socket.send(JSON.stringify({ ok: true }));
                this._phase = 1;

                break;

            case 1: // client update!
                if(data.msg === "pong") {
                    
                }
                this.fire(data.msg, data);

                break;


        }
    },
    
    _watchdog_fire: function() {
        if(this._socket.readyState == 1) {
            this._socket.send(JSON.stringify({
                msg: "ping"
            }));
        } else if(this._socket.readyState > 1) {
            
        }
    }

});
Display.Websocket = L.Class.extend({
    options: {
       

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
    },
    
    open: function() {
        this._socket = new WebSocket(this._uri);
        this._socket.onopen = this._onOpen.bind(this);
        this._socket.onmessage = this._onMessage.bind(this);
    },
    
    _onOpen: function() {
        
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
                this.fire(data.msg, data);

                break;


        }
    },

});
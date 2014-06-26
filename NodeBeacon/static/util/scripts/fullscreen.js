var myname = window.location.search.substring(1);




var loc = window.location, new_uri;
if (loc.protocol === "https:") {
    new_uri = "wss:";
} else {
    new_uri = "ws:";
}
new_uri += "//" + loc.host;
new_uri += "/display";

var websocket = new WebSocket(new_uri);

websocket.onmessage = function(msg) {
    msg = JSON.parse(msg.data);
    
    if(msg.hello) {
        websocket.send(JSON.stringify({ name: myname }));
    } else {
        
        if(msg.msg === "change") {
            var data = msg.data;
            
            $("#main").attr("src", data.url);
        }
        
    }
};

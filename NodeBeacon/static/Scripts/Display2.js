

var display = new Display();

display.createMap("map");

window.addEventListener("orientationchange", onOrientationChange);

function onOrientationChange() {
    window.scroll(0, 0);
}

function findBeacon(major, minor) {
    var i;
    for(i in beaconsList) {
        if(!beaconsList.hasOwnProperty(i)) return;
        
        if(beaconsList[i].major == major && beaconsList[i].minor == minor)
            return beaconsList[i];
    }
    
    return null;
}










var clients = {};
var clientContainer = new OverlappingMarkerSpiderfier(map, {
    circleFootSeparation: 50,
    keepSpiderfied: true
});


/*
var socket = null;
var socket_connect_timeout = 100;
var socket_connect_timer = null;
var socket_keepalive = null;

var socket_onOpen = function () {
    socket.onmessage = socketMessageHandler;
    socket_connect_timeout = 100; //reset this limit
    socket_keepalive = setInterval(function() {
        socket.send(JSON.stringify({ping: true}));
    }, 30000);
};

var reconnect = function() {
    socket = new WebSocket(new_uri);
    socket.onopen = socket_onOpen;
    socket.onclose = socket_onClose;
    socket.onerror = socket_onClose;
    socket.phase = 0;
    socket_connect_timeout = socket_connect_timeout * 1.1;
};

var socket_onClose = function () {
    //server died, let's try to reconnect!
    socket_connect_timer = setTimeout(reconnect, socket_connect_timeout);
    if(socket_keepalive)
        clearInterval(socket_keepalive);
        
};
*/

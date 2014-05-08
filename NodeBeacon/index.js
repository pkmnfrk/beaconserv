require("./polyfills");


var 
    server = require("./server"),
    router = require("./router"),
    requestHandlers = require("./requestHandlers"),
    realtime_map = require("./realtime_map"),
    database = require("./database");

var handle = {
    //"^/$": function(req, res) { requestHandlers.static(req, res, "/map.html"); },
    "^/beacon(/.*)?": requestHandlers.beacons,
    "^/ping/[-a-fA-F0-9]+/\\d+/\\d+": requestHandlers.ping,
    //"^/socket$": realtime_map.handleSocket
    "^/client$": requestHandlers.client,
    "^/state$": requestHandlers.state,
    "^/client/my/name": requestHandlers.name
};

router.setStaticHandler(requestHandlers.static);

database.start(function() {
    
    server.start(router.route, handle);
    realtime_map.start();
    
});
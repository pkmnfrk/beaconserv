var server = require("./server"),
    router = require("./router"),
    requestHandlers = require("./requestHandlers"),
    realtime_map = require("./realtime_map"),
    database = require("./database");

var handle = {
    "^/beacon(/.*)?": requestHandlers.beacons,
    //"^/socket$": realtime_map.handleSocket
};

router.setStaticHandler(requestHandlers.static);

database.start(function() {
    
    server.start(router.route, handle);
    realtime_map.start();
    
});
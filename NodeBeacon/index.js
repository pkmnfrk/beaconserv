require("./polyfills");


var 
    server = require("./server"),
    router = require("./router"),
    requestHandlers = require("./requestHandlers"),
    realtime_map = require("./realtime_map"),
    fullscreen_display = require("./fullscreen_display"),
    database = require("./database");

var handle = {
    "^/client$": requestHandlers.client,
    "^/state$": requestHandlers.state
};

router.setStaticHandler(requestHandlers.static);

database.start(function() {
    
    server.start(router.route, handle);
    realtime_map.start();
    fullscreen_display.start();
    
});
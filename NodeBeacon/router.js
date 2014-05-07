var url = require("url");

var _staticHandler = null;

function route(handle, request, response) {
    var pathname = url.parse(request.url).pathname;
    //console.log("About to route a request for " + pathname);
    
    var handler = null;
    
    for(var h in handle) {
       if(!handle[h].r) {
            handle[h].r = new RegExp(h, "i");
       }
        
        if(handle[h].r.test(pathname)) {
            handler = handle[h];
            break;
        }
    }
    
    if(handler) {
        handler(request, response);
    } else {
        if(_staticHandler) {
            _staticHandler(request, response);
        } else {
            console.log("No request handler found for " + pathname);
            response.writeHead("404 Not Found");
            response.write("404 Not Found");
            response.end();
        }
    }
}

function setStaticHandler(staticHandler) {
    if(typeof staticHandler !== "function")
        throw "Not a function";
    
    _staticHandler = staticHandler;
}

exports.route = route;
exports.setStaticHandler = setStaticHandler;
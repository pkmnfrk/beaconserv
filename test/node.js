/* jshint node:true, multistr:true */
var http = require("http"),
    ws = new require("ws"),
    port = process.env.PORT || 8888,
    wsport = parseInt(port, 10) || 8082;

var server = http.createServer(function(req, res) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(page);
    res.end();
}).listen(port);


var socketServer = new ws.Server({
    server: server,
    path: "/socket"
}).on("connection", function(ws) {
    console.log("Connection!");
});

var page = "<!doctype html><html><body>\
<script>\
try {var ws = new WebSocket(\"ws://localhost:" + wsport + "/socket\");\
ws.onerror = function(){alert(\"error\");};\
ws.onopen = function(){alert(\"Socket Open\")};} catch(e) { alert(e); };\
</script>\
</body></html>";
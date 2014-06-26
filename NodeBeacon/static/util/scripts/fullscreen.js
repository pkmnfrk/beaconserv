
function onmessage(msg) {
    $("#loader").hide();
    
    msg = JSON.parse(msg.data);
    
    if(msg.hello) {
        websocket.send(JSON.stringify({ name: myname }));
    } else {
        
        if(msg.msg === "change") {
            var data = msg.data;
            
            $("#main").attr("src", data.url);
        } else if(msg.msg === "refresh") {
            window.location = window.location;
        }
        
    }
}


function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function tryConnect() {
    if(errorRetry) {
        clearTimeout(errorRetry);
        errorRetry = null;
    }
    
    
    
    websocket = new WebSocket(new_uri);

    websocket.onmessage = onmessage;
    
    var onfud = function() {
        $("#loader").show();
        
        errorRetry = setTimeout(tryConnect, 1000);
    };
    
    websocket.onerror = onfud;
    websocket.onclose = onfud;
    
}

var errorRetry = null;


var myname = window.location.search.substring(1);

var loc = window.location, new_uri;
if (loc.protocol === "https:") {
    new_uri = "wss:";
} else {
    new_uri = "ws:";
}
new_uri += "//" + loc.host;
new_uri += "/display";

var websocket = null;

tryConnect();

$(".fsbutton").click(toggleFullScreen);
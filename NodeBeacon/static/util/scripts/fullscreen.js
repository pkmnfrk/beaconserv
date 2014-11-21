
function onmessage(msg) {
    $("#loader").hide();
    
    msg = JSON.parse(msg.data);
    
    if(msg.hello) {
        websocket.send(JSON.stringify({ name: myname }));
        
        keepalive = setInterval(function() {
            websocket.send(JSON.stringify({ping: true}));
        }, 15000);
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

function toggleOverlay() {
    $("#shadow").toggle();
    $("#overlay").toggle();
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
        if(keepalive) clearInterval(keepalive);
        
        errorRetry = setTimeout(tryConnect, 1000);
    };
    
    websocket.onerror = onfud;
    websocket.onclose = onfud;
    
}

var errorRetry = null;
var keepalive = null;

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

$(".fsbutton, #close-overlay").click(function() {
    toggleOverlay();
    
});
$("#go-fullscreen").click(function() {
    toggleFullScreen();
    toggleOverlay();
});

$(".urlbutton").click(function(e) {
    e.preventDefault();
    var url = $(this).data("url");
    
    $("#main").attr("src", url);
    
    toggleOverlay();
});

$(window).on("message", function(evt) {
    var msg = evt.originalEvent.data;
    
    websocket.send(msg);
});
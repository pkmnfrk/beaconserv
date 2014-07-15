function Display() {
    this.zoomOffset = 15;
    this.scalar = 0x4c10;
    this._in_device = location.search === "?ios";
    this._in_tv = location.search === "?tv";
    this.labels = [];
    this.beacons = [];
    
    $("#debugArea").remove();

    var updateStatusBar = navigator.userAgent.match(/iphone|ipad|ipod/i) &&
            parseInt(navigator.appVersion.match(/OS (\d)/)[1], 10) >= 7;

    if (updateStatusBar) {
        document.body.style.marginTop = '20px';
    }
}


Display.prototype = {
    inDevice: function() {
        return this._in_device;
    },
    
    inTv: function() {
        return this._in_tv;
    },
    
    editable: function() {
        return !this.inTv() && !this.inDevice();
    },
    
    shouldShowLabels: function() {
        return true;
    },
    
    createMarker: function() {
        
    }
};

var display = new Display();



function showMarkers(force) {
    var b;
    
    if(show_markers && !force) return;
    
    show_markers = true;
    
    var newList = [];
    
    for (var minor in beaconsList) {

        if (beaconsList.hasOwnProperty(minor)) {
            b = beaconsList[minor];
            newList.push(b);
        }


    }



    var anim = function addBeacon(beacons) {

        if (beacons.length) {
            do {
                b = beacons.shift();
            } while (b.minor === 0);

            addMarkerToMap(b);
            
            
            if(in_device) {
                addBeacon(beacons);
            } else {
                setTimeout(function () { addBeacon(beacons); }, 100);
            }
        } else {
            beaconsLoaded = true;
            processUpdates();
        }

    };

    anim(newList);
}


function showLabels(data)
{
    labels = data;
    
    for(var i = 0; i < labels.length; i++) {
        var l = labels[i];

        l.label = new B.SimpleLabel([l.latitude, l.longitude], {
            text: l.text,
            minZoom: l.minZoom
        });
        
        l.label.label = l;

        map.addLayer(l.label);

        if(editable) {
            l.label.on('click', showEditorDialog);
        }
            
        


    }
}

function addMarkerToMap(b) {
    console.log("addMarkerToMap");
    marker = L.marker([b.latitude, b.longitude], {
        //bounceOnAdd: true,
        draggable: editable
    });
    marker.addTo(map);

    marker.beacon = b;


    if(in_device) {
        marker.on("click", (function(b) { return function(e) {


            if(in_device) {
                sendMessageToOverlord("click", {
                    major: b.major,
                    minor: b.minor
                });

                return false;
            }

        }; })(b));
    } 
    
    if(editable) {
        marker.on('drag', onMarkerDrag);
        marker.on('dragend', onMarkerDragEnd);
        //marker.on('click', showEditorDialog);
        //marker.bindPopup(b.title);
    }

    var bx = findBeacon(b.major, b.minor);
    bx.marker = marker;

}

function hideMarkers() {
    show_markers = false;
    
    for (var minor in beaconsList) {
        if(beaconsList[minor].marker) {
            map.removeLayer(beaconsList[minor].marker);
            beaconsList[minor].marker = null;
        }
    }
}

function onOrientationChange() {
    window.scroll(0, 0);
}

function loadBeacons() {
    B.getBeaconsDict("2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, function (beacons) {
        beaconsList = beacons;
        
        for (var minor in beaconsList) {

            if (beaconsList.hasOwnProperty(minor)) {
                b = beaconsList[minor];

                b.latitude /= scalar;
                b.longitude /= scalar;
            }
        }
        
        if(show_markers) {
            show_markers = false;
            showMarkers();
        } else {
            beaconsLoaded = true;
            processUpdates();
        }
    });
    
    if(show_labels){
        B.getLabels(showLabels);
    }

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

window.addEventListener("orientationchange", onOrientationChange);

var map = L.map('map', {
    center: [-53.75 / scalar, 72.5 / scalar],
    zoom: zoomOffset + 2,
    crs: L.CRS.Simple,
    maxZoom: zoomOffset + 5,
    maxBounds: [
        [64/scalar, -64/scalar],
        [-196/scalar, 196/scalar]

    ],
    zoomControl: !(in_device || in_tv),
    fullscreenControl: !(in_device || in_tv),
    attributionControl: !(in_device || in_tv)

}).on('mousemove', function (e) {
    
}).on('click', function (e) {
    $("#debugArea").val("[" + (e.latlng.lat).toString() + ", " + (e.latlng.lng ).toString() + "]");
    $("#debugArea").focus();
    $("#debugArea").select();
    
    return false;
    
}).on('load', function (e) {
    
}).on('viewreset', function(e) {
    var z = map.getZoom();
    $("#debugArea").val(z);
});


var layerOpts = {
    minZoom: zoomOffset,
    maxZoom: zoomOffset + 5,
    maxNativeZoom: 4,
    tileSize: 256,
    continuousWorld: true,
    noWrap: true,
    zoomOffset: -zoomOffset,
    bounds: [
        [0, 0],
        [-127.9, 127.9]

    ]
};

L.tileLayer('/Content/maps/7th/{z}/{x}/{y}.png', layerOpts).addTo(map);

//L.tileLayer('/Content/maps/7thB/{z}/{x}/{y}.png', layerOpts).addTo(map);

if(!(in_device || in_tv)) {
    L.control.scale().addTo(map);
}

var beaconsList;
var beaconsLoaded = false;


var displayViews = {
    tracer: new B.DisplayView.TraceClientPaths({
        map: map
    }),

    default: ['tracer']
};

var currentView = 'default';


map.setView([-53.75 / scalar, 72.5 / scalar], zoomOffset + 2);

var runViews = function () {
    var curView;
    var myView = displayViews[currentView];

    if (myView instanceof Array) {
        if (typeof myView.curIndex == "undefined") {
            myView.curIndex = myView.length;
        } else {
            myView.curIndex += 1;
        }

        if (myView.curIndex >= myView.length) {
            myView.curIndex = 0;
        }

        curView = displayViews[myView[myView.curIndex]];
    } else {
        curView = myView;
    }

    curView.start(function () {
        runViews();
    });
};

//runViews();

var clients = {};
var clientContainer = new OverlappingMarkerSpiderfier(map, {
    circleFootSeparation: 50,
    keepSpiderfied: true
});

var loc = window.location, new_uri;
if (loc.protocol === "https:") {
    new_uri = "wss:";
} else {
    new_uri = "ws:";
}
new_uri += "//" + loc.host;
new_uri += "/socket";


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

B.getPrefs(function(prefs) {
    if(prefs.supportsWebsockets) {
        reconnect();
    }
});

var myIdentifier;

var pendingUpdates = [];

var socketMessageHandler = function (msg) {
    var data = JSON.parse(msg.data);
    switch (socket.phase) {
        case 0: //waiting for identifier
            myIdentifier = data.identifier;
            socket.send(JSON.stringify({ ok: true }));
            socket.phase = 1;

            break;

        case 1: // client update!
            if (!beaconsLoaded) {
                pendingUpdates.push(msg);
            } else {
                switch (data.msg) {
                    case "client":
                        console.log("adding client " + data.name);
                        var client = clients[data.clientid];
                        var b = findBeacon(data.major, data.minor);

                        var pos = L.latLng(b.latitude, b.longitude);

                        clientContainer.unspiderfy();

                        if (!client) {
                            clients[data.clientid] = {
                                clientid: data.clientid,
                                marker: null,
                                zIndexOffset: 10000,
                            };
                            client = clients[data.clientid];
                        } 
                        
                        if(client.marker === null) {
                            client.marker = L.marker(pos, {
                                    icon: B.redMarker
                                }).addTo(map).on("click", function(e) {
                                
                                
                                if(in_device) {
                                    sendMessageToOverlord("click", {
                                        major: b.major,
                                        minor: b.minor
                                    });
                                    
                                    return false;
                                }
                                
                            });
                            
                            clientContainer.addMarker(client.marker);
                        }
                        
                        client.marker.setLatLng(pos);
                        

                        if(!in_device) {
                            client.marker.bindPopup(data.name);
                        
                            if(client.removalTimer) {
                                clearTimeout(client.removalTimer);
                                client.removalTimer = null;
                            }

                            client.removalTimer = setTimeout(function() {
                                map.removeMarker(client.marker);
                                client.marker = null;
                                client.removalTimer = null;
                            }, 10 * 60 * 1000);
                        }
                        break;
                        
                    case "beacon":
                        console.log("Adding/updating beacon");
                        
                        //do we know about this beacon already?
                        b = findBeacon(data.beacon.major, data.beacon.minor);
                        
                        data.beacon.latitude /= scalar;
                        data.beacon.longitude /= scalar;
                        
                        if(b) {
                            console.log("Existing beacon, removing it and adding a new one");
                            //we just need to update some incidentals
                            
                            
                            for(var prop in data.beacon) {
                                b[prop] = data.beacon[prop];
                            }
                            
                            if(b.marker) {
                                b.marker.setLatLng([data.beacon.latitude, data.beacon.longitude]);
                            }
                            
                            
                        } else {
                            console.log("New beacon, just adding it");
                            //we need to add it new
                            b = data.beacon;
                            beaconsList[b.minor] = b;
                            
                            if(show_markers) {
                                addMarkerToMap(b);
                            }

                        }
                        
                        
                        
                        
                        break;
                }
            }

            break;
            
            
    }
};

var processUpdates = function () {
    while (pendingUpdates.length) {
        var msg = pendingUpdates.shift();
        socketMessageHandler(msg);
    }
};

var onMarkerDragEnd = function(e) {
    this.beacon.latitude = this.getLatLng().lat * scalar;
    this.beacon.longitude = this.getLatLng().lng * scalar;
    B.saveBeacon(this.beacon);
};

var onMarkerDrag = function(e) {
    //this.beacon.latitude = this.getLatLng().lat;
    //this.beacon.longitude = this.getLatLng().lng;
    
    
};

var callbackCounter = 1;
var sendMessageToOverlord = function(action, params, callback) {
    if(!in_device) return;
    
    if(typeof params === "function") {
        callback = params;
        params = null;
    }
    
    if(callback && typeof callback === "function") {
        var cbid = "myapp_callback_" + callbackCounter;
        window[cbid] = callback;
        if(!params) {
            params = {
                callback: cbid
            };
        }
    }
    
    var url = "myapp://" + action;
    
    if(params) {
        url += "?";
        var args = [];
        
        for(var key in params) {
            
            if(params.hasOwnProperty(key)) {
                args.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
            }
        }
        
        url += args.join("&");
    }
    
    window.location = url; //this won't actually navigate, hopefully
};



loadBeacons();
/*
if (socket) {
    
} else {
    //test items

    var testData = [
        4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5
    ];
    socket = {
        send: function () { },
        phase: 0
    };

    socketMessageHandler({
        data: JSON.stringify({
            identifier: "a"
        })
    });


    setTimeout(function () {
        for (var i = 0; i < testData.length; i++) {
            var minor = testData[i];
            socketMessageHandler({
                data: JSON.stringify({
                    msg: "client",
                    clientid: i,
                    uuid: "2f73d96d-f86e-4f95-b88d-694cefe5837f",
                    major: 7,
                    minor: minor
                })
            });


        }
    }, 1000);
}*/
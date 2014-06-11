var zoomOffset = 15;
var scalar = 0x4c10;


var in_device = false;
var in_tv = false;

if(location.search == "?ios") {
    in_device = true;
} else if(location.search == "?tv") {
    in_tv = true;
}

var show_markers = in_device;

if(in_device || in_tv) {
    $("#debugArea").remove();
}

var updateStatusBar = navigator.userAgent.match(/iphone|ipad|ipod/i) &&
        parseInt(navigator.appVersion.match(/OS (\d)/)[1], 10) >= 7;
if (updateStatusBar) {
    document.body.style.marginTop = '20px';
}

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

            marker = L.marker([b.latitude, b.longitude], {
                //bounceOnAdd: true,
                draggable: !(in_device || in_tv)
            })
                .addTo(map)
            ;
            marker.bindPopup(b.title);
            marker.beacon = b;
            marker.on('drag', onMarkerDrag);
            marker.on('dragend', onMarkerDragEnd);

            var bx = findBeacon(b.major, b.minor);
            bx.marker = marker;

            setTimeout(function () { addBeacon(beacons); }, 100);
        } else {
            beaconsLoaded = true;
            processUpdates();
        }

    };

    anim(newList);
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
    maxBounds: [
        [64/scalar, -64/scalar],
        [-196/scalar, 196/scalar]

    ],
    zoomControl: !(in_device || in_tv),
    fullscreenControl: !(in_device || in_tv),
    attributionControl: !(in_device || in_tv)

}).on('mousemove', function (e) {
    
}).on('click', function (e) {
    $("#debugArea").val("[" + (e.latlng.lat * scalar).toString() + ", " + (e.latlng.lng * scalar).toString() + "]");
    $("#debugArea").focus();
    $("#debugArea").select();
    
    return false;
    
}).on('load', function (e) {
    
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

L.tileLayer('/Content/maps/7thB/{z}/{x}/{y}.png', layerOpts).addTo(map);

if(!(in_device || in_tv)) {
    L.control.scale().addTo(map);
}

var polys = [
    /*{
        coords: [
            [-1.8125, 33.4375],
            [-26.125, 33.3125],
            [-35.625, 42.9375],
            [-33.6875, 45.0625],
            [-29.75, 44.6875],
            [-30.0625, 79.6875],
            [-47.1875, 96.9375],
            [-49.9375, 97],
            [-50.25, 125.0625],
            [-1.5625, 125.3125],
            [-1.375, 75.9375],
            [-9.25, 76.0625],
            [-9.1875, 57.875],
            [-1.625, 57.9375]

        ],
        label: "K2",
        color: "#080",
        fillColor: "#080",
    }*/
];

for (var i = 0; i < polys.length; i++) {
    var poly = polys[i];
    for (var j = 0; j < poly.coords.length; j++) {
        poly.coords[j][0] /= scalar;
        poly.coords[j][1] /= scalar;
    }
    var p = L.polygon(poly.coords, {
        color: poly.color,
        fillColor: poly.fillColor,
        fillOpacity: 0.5,
    }).addTo(map);

    p.bindPopup(poly.label);
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

var socket_onOpen = function () {
    socket.onmessage = socketMessageHandler;
    socket_connect_timeout = 100; //reset this limit
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
                        
                        if(b) {
                            //we just need to update some incidentals
                            if(b.marker) {
                                map.removeLayer(b.marker);
                                b.marker = null;
                            }
                            
                            for(var prop in data.beacon) {
                                b[prop] = data.beacon[prop];
                            }
                            
                            
                            
                            
                        } else {
                            //we need to add it new
                            b = data.beacon;
                            beaconsList[b.minor] = b;
                            
                            
                        }
                        
                        b.latitude /= scalar;
                        b.longitude /= scalar;
                        
                        if(show_markers) {
                            b.marker = L.marker([b.latitude, b.longitude], {
                                draggable: !(in_device || in_tv)
                            }).addTo(map);
                            b.marker.bindPopup(b.title);
                            b.marker.beacon = b;
                            b.marker.on('drag', onMarkerDrag);
                            b.marker.on('dragend', onMarkerDragEnd);
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
    
    this.beacon.marker = undefined;
    
    B.saveBeacon(this.beacon);
    
    this.beacon.marker = this;
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
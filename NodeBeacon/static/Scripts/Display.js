var zoomOffset = 15;
var scalar = 0x4c10;

var updateStatusBar = navigator.userAgent.match(/iphone|ipad|ipod/i) &&
        parseInt(navigator.appVersion.match(/OS (\d)/)[1], 10) >= 7;
if (updateStatusBar) {
    document.body.style.marginTop = '20px';
}

function onOrientationChange() {
    window.scroll(0, 0);
}

function loadBeacons() {
    B.getBeaconsDict("2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, function (beacons) {
        beaconsList = beacons;

        var newList = [];

        for (var minor in beaconsList) {

            if (beaconsList.hasOwnProperty(minor)) {
                newList.push(beaconsList[minor]);
            }


        }

        var anim = function addBeacon(beacons) {

            if (beacons.length) {
                var b;
                do {
                    b = beacons.shift();
                } while (b.minor === 0);

                b.latitude /= scalar;
                b.longitude /= scalar;


                marker = L.marker([b.latitude, b.longitude], {
                    bounceOnAdd: true
                })
                    .addTo(map)
                ;
                marker.bindPopup(b.title);

                setTimeout(function () { addBeacon(beacons); }, 100);
            } else {
                beaconsLoaded = true;
                processUpdates();
            }

        };

        anim(newList);

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
    fullscreenControl: true

}).on('mousemove', function (e) {
    
}).on('click', function (e) {
    $("#debugArea").val("[" + (e.latlng.lat * scalar).toString() + ", " + (e.latlng.lng * scalar).toString() + "]");
    $("#debugArea")[0].focus();
    $("#debugArea")[0].select();
    
    return false;
    
}).on('load', function (e) {
    
});


L.tileLayer('/Content/maps/7th/{z}/{x}/{y}.png', {
    minZoom: zoomOffset,
    maxZoom: zoomOffset + 6,
    maxNativeZoom: 5,
    tileSize: 256,
    continuousWorld: true,
    noWrap: true,
    zoomOffset: -zoomOffset,
    bounds: [
        [0, 0],
        [-127.9, 127.9]

    ]
})
    
    .addTo(map);

L.control.scale().addTo(map);

var polys = [
    {
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
    }
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
try {
    
    socket = new WebSocket(new_uri);
    socket.onopen = function () {
        socket.onmessage = socketMessageHandler;
    };
    socket.onclose = function () {
        //server died, let's refresh!
        //window.location = window.location;
    };
    socket.phase = 0;
    
    
} catch (ex) {
    //must be in dev
}

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
                                marker: L.marker(pos, {
                                    icon: B.redMarker
                                }).addTo(map),
                                zIndexOffset: 10000,
                            };
                            client = clients[data.clientid];
                            clientContainer.addMarker(client.marker);


                        } else {
                            client.marker.setLatLng(pos);
                        }

                        client.marker.bindPopup(data.name);

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
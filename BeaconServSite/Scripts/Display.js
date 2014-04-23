var zoomOffset = 17;

var map = L.map('map', {
    center: [-53.75 / 0x20000, 72.5 / 0x20000],
    zoom: zoomOffset + 2,
    crs: L.CRS.Simple,
    maxBounds: [
        [64/0x20000, -64/0x20000],
        [-196/0x20000, 196/0x20000]

    ]

}).on('mousemove', function (e) {
    
}).on('click', function (e) {
    $("#debugArea").val("[" + (e.latlng.lat * 0x20000).toString() + ", " + (e.latlng.lng * 0x20000).toString() + "]");
    $("#debugArea")[0].focus();
    $("#debugArea")[0].select();
    
    return false;
    
});



L.tileLayer('/Content/maps/7th/{z}/{x}/{y}.png', {
    minZoom: zoomOffset,
    maxZoom: zoomOffset + 6,
    maxNativeZoom: 5,
    tileSize: 128,
    continuousWorld: true,
    noWrap: true,
    zoomOffset: -zoomOffset
    /*bounds: [
        [0, 0],
        [-127.9, 127.9]

    ]*/
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
        color: "#f00",
        fillColor: "#f00",
    }
];

for (var i = 0; i < polys.length; i++) {
    var poly = polys[i];
    for (var j = 0; j < poly.coords.length; j++) {
        poly.coords[j][0] /= 0x20000;
        poly.coords[j][1] /= 0x20000;
    }
    var p = L.polygon(poly.coords, {
        color: poly.color,
        fillColor: poly.fillColor,
        fillOpacity: 0.5,
    }).addTo(map);

    p.bindPopup(poly.label);
}

/*
var beacons = [
    {
        coords: [-71.9375, 125.45313],
        label: "7.4"
    },
    {
        coords: [-76.125, 49.46875],
        label: "7.5"
    },
    {
        coords: [-49.21875, 53.71875],
        label: "7.6"
    },
    {
        coords: [-54.44531, 25.99219],
        label: "7.7"
    },
    {
        coords: [-36.83594, 30.14063],
        label: "7.8"
    },
    {
        coords: [-73.77344, 109.73438],
        label: "7.9"
    },
    {
        coords: [-54.88281, 18.60938],
        label: "7.10"
    },
    {
        coords: [-70.0625, 61.49219],
        label: "7.11"
    },

];
*/

B.getBeacons("2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, function addBeacon(beacons) {
    
    if (beacons.length) {
        var b = beacons.shift();

        b.latitude /= 0x20000;
        b.longitude /= 0x20000;


        var marker = L.marker([b.latitude, b.longitude], {
            bounceOnAdd: true
        }).addTo(map);
        marker.bindPopup(b.title)

        /*
        var circle = L.circle([b.latitude, b.longitude], 25, {
            color: '#00f',
            fillColor: '#00f',
            fillOpacity: 0.1
        }).addTo(map);
        */

        setTimeout(function () { addBeacon(beacons); }, 200);
    }

});


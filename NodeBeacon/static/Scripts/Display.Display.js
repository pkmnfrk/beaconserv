/* jshint browser:true, undef: true, unused: true */
/* global $, L, B */
/* exported Display */

function Display() {
    this.zoomOffset = 15;
    this.scalar = 0x4c10;
    this._in_device = location.search === "?ios";
    this._in_tv = location.search === "?tv";
    this.labels = [];
    this.beacons = [];
    this.markers = [];
    this.map = null;
    this.zoomOffset = 15;
    
    $("#debugArea").remove();

    var updateStatusBar = navigator.userAgent.match(/iphone|ipad|ipod/i) &&
            parseInt(navigator.appVersion.match(/OS (\d)/)[1], 10) >= 7;

    if (updateStatusBar) {
        document.body.style.marginTop = '20px';
    }
    
    this._appProxy = new B.AppProxy("myapp");
    
    this._loadBeacons(this._onBeaconsLoaded);
    
    B.getPrefs(function(prefs) {
        if(prefs.supportsWebsockets) {
            this._socket = new Display.Websocket();
            //bind events to the socket
            this._socket.on('client', this._msg_client);
            this._socket.on('beacon', this._msg_beacon);
            this._socket.open();
        }
    });
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
    
    shouldShowMarkers: function() {
        return !this.inTv();
    },
    
    shouldShowLabels: function() {
        return true;
    },
    
    getAppProxy: function() {
        return this._appProxy;
    },
    
    createMap: function(div)
    {
        var self = this;
        this.map = L.map(div, {
            center: [-53.75 / this.scalar, 72.5 / this.scalar],
            zoom: this.zoomOffset + 2,
            crs: L.CRS.Simple,
            maxZoom: this.zoomOffset + 5,
            maxBounds: [
                [64/this.scalar, -64/this.scalar],
                [-196/this.scalar, 196/this.scalar]

            ],
            zoomControl: !(this.inDevice() || this.inTv()),
            fullscreenControl: !(this.inDevice() || this.inTv()),
            attributionControl: !(this.inDevice() || this.inTv())

        }).on('mousemove', function () {

        }).on('click', function (e) {
            $("#debugArea").val("[" + (e.latlng.lat).toString() + ", " + (e.latlng.lng ).toString() + "]");
            $("#debugArea").focus();
            $("#debugArea").select();

            return false;

        }).on('load', function () {

        }).on('viewreset', function() {
            var z = self.map.getZoom();
            $("#debugArea").val(z);
        });
        
        var layerOpts = {
            minZoom: this.zoomOffset,
            maxZoom: this.zoomOffset + 5,
            maxNativeZoom: 4,
            tileSize: 256,
            continuousWorld: true,
            noWrap: true,
            zoomOffset: -this.zoomOffset,
            bounds: [
                [0, 0],
                [-127.9, 127.9]

            ]
        };

        L.tileLayer('/Content/maps/7th/{z}/{x}/{y}.png', layerOpts).addTo(this.map);

        //L.tileLayer('/Content/maps/7thB/{z}/{x}/{y}.png', layerOpts).addTo(map);

        if(!(this.inDevice() || this.inTv())) {
            L.control.scale().addTo(this.map);
        }
        
        this.map.setView([-53.75 / this.scalar, 72.5 / this.scalar], this.zoomOffset + 2);
        
        
        this._loadMarkers(this._onMarkersLoaded);
    },
    
    _loadBeacons: function(whenDone) {
        var self = this;
        
        B.getBeacons("2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, function (beacons) {
            self.beacons = beacons;

            for (var i = 0; i < self.beacons.length; i++) {
                var b = self.beacons[i];

                b.latitude /= self.scalar;
                b.longitude /= self.scalar;
                
            }

            if(whenDone)
                whenDone.apply(self);
        });


    },
    
    _onBeaconsLoaded: function()
    {
    
    },
    
    _loadMarkers: function(whenDone)
    {
        var self = this;
        
        B.getMarkers(7, function(markers) {
            self.markers = markers;
            
            for(var i = 0; i < self.markers.length; i++)
            {
                var m = self.markers[i];

                self.markers[i] = L.marker([ m.latitude, m.longitude ], {
                    draggable: true
                });
                
                self.markers[i].rawData = m;
                self.markers[i].on('dragend', self._onMarkerDragEnd);
            }

            if(whenDone)
                whenDone.apply(self);
        });
    },
    
    _onMarkersLoaded: function()
    {
        if(this.shouldShowMarkers()) {
            for(var i = 0; i < this.markers.length; i++) {
                this.map.addLayer(this.markers[i]);
            }
        }
    },
    
    _onMarkerDragEnd: function()
    {
        //this, in this case, is the marker
        var latlng = this.getLatLng();
        this.rawData.latitude = latlng.lat;
        this.rawData.longitude = latlng.lng;
        
        B.storeMarker(this.rawData);
        
    },
    
    _msg_client: function(data) {
        data = data;
        /*console.log("adding client " + data.name);
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
        }*/
    },
    
    _msg_beacon: function(data) {
        console.log("Adding/updating beacon");
        data = data;
/*
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

        }*/
    }
    
};
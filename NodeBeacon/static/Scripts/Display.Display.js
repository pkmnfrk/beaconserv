/* jshint browser:true, undef: true, unused: true */
/* global $, L, B, OverlappingMarkerSpiderfier */
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
    this.floor = 7;
    
    $("#debugArea").remove();

    var updateStatusBar = navigator.userAgent.match(/iphone|ipad|ipod/i) &&
            parseInt(navigator.appVersion.match(/OS (\d)/)[1], 10) >= 7;

    if (updateStatusBar) {
        document.body.style.marginTop = '20px';
    }
    
    this._appProxy = new B.AppProxy("myapp");
    
    this._loadBeacons(this._onBeaconsLoaded);
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
        if(this.inTv()) {
            $("body").addClass("tv");
        }
        
        if(this.inDevice()) {
            $("body").addClass("device");
        }
        
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
            maxNativeZoom: 5,
            tileSize: 256,
            continuousWorld: true,
            noWrap: true,
            zoomOffset: -this.zoomOffset,
            bounds: [
                [0, 0],
                [-127.9, 127.9]

            ],
            unloadInvisibleTiles: false
        };

        L.tileLayer('/Content/maps/floor_' + this.floor + '/{z}/{x}/{y}.png', layerOpts).addTo(this.map);

        //L.tileLayer('/Content/maps/7thB/{z}/{x}/{y}.png', layerOpts).addTo(map);

        if(!(this.inDevice() || this.inTv())) {
            L.control.scale().addTo(this.map);
        }
        
        this.map.setView([-53.75 / this.scalar, 72.5 / this.scalar], this.zoomOffset + 2);
        
        this.clients = {};
        this._clientContainer = new OverlappingMarkerSpiderfier(this.map, {
            circleFootSeparation: 50,
            keepSpiderfied: true
        });
        
        this._loadMarkers(this._onMarkersLoaded);
        this._loadLabels(this._onLabelsLoaded);
        
        B.getPrefs(function(prefs) {
            if(prefs.supportsWebsockets) {
                this._socket = new Display.Websocket();
                //bind events to the socket
                this._socket.on('client', this._msg_client, this);
                this._socket.on('beacon', this._msg_beacon, this);
                this._socket.open();
            }
        }.bind(this));
        
        if(this.editable()) {
            this.initializeEditors();
        }
    },
    
    _loadBeacons: function(whenDone) {
        var self = this;
        
        B.getBeacons("2f73d96d-f86e-4f95-b88d-694cefe5837f", this.floor, function (beacons) {
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
        B.getMarkers(this.floor, function(markers) {
            this.markers = markers;
            
            for(var i = 0; i < this.markers.length; i++)
            {
                this.markers[i] = this._createMarkerFromData(this.markers[i]);
                    
            }

            if(whenDone)
                whenDone.apply(this);
        }.bind(this));
    },
    
    _createMarkerFromData: function(data) {
        var ret = L.marker([data.latitude, data.longitude], {
            draggable: this.editable(),
            icon: B.animatedMarker
        });
        
        ret.bindPopup(data.title);
        ret.rawData = data;
        ret.display = this;
        
        if(this.editable()) {
            ret.on('dragend', this._onMarkerDragEnd);
        }
        
        if(this.inDevice()) {
            ret.on('click', this._marker_click.bind(ret));
        }
        
        return ret;
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
        
        B.storeMarker(this.rawData, function(obj) {
            if(obj) {
                this.rawData = obj;
            }
        }.bind(this));
        
    },
    
    _marker_click: function() {
        if(this.display.inDevice()) {
            this.display.getAppProxy().send("marker_click", {
                id: this.rawData._id
            });

            return false;
        }
    },
    
    _loadLabels: function(whenDone)
    {
        
        B.getLabels(this.floor, function(labels) {
            this.labels = labels;
            
            for(var i = 0; i < this.labels.length; i++)
            {
                
                this.labels[i] = this._createLabelFromData(this.labels[i]);
            }           

            if(whenDone)
                whenDone.apply(this);
        }.bind(this));
    },
    
    _createLabelFromData: function(data) {
        var ret = new B.SimpleLabel([data.latitude, data.longitude], {
            text: data.text,
            minZoom: data.minZoom,
            draggable: this.editable()
        });
        
        ret.rawData = data;
        
        if(this.editable()) {
            ret.on('dragend', this._onLabelDragEnd);
        }
        
        return ret;
    },
    
    _onLabelsLoaded: function()
    {
        if(this.shouldShowLabels()) {
            for(var i = 0; i < this.labels.length; i++) {
                this.map.addLayer(this.labels[i]);
            }
        }
    },
    
    _onLabelDragEnd: function()
    {
        //this, in this case, is the marker
        var latlng = this.getLatLng();
        this.rawData.latitude = latlng.lat;
        this.rawData.longitude = latlng.lng;
        
        B.storeLabel(this.rawData);
        
    },
    
    _msg_client: function(data) {
        //data = data;
        var self = this;
        
        console.log("adding client " + data.name);
        
        this._clientContainer.unspiderfy();
        
        var client = this.clients[data.clientid];

        if(client) {
            this._clientContainer.removeMarker(client.marker);
            this.map.removeLayer(client.marker);
            delete this.clients[data.clientid];
        }
        
        var pos = L.latLng(data.latitude / this.scalar, data.longitude / this.scalar);
        
        client = {
            clientid: data.clientid,
            marker: null,
            zIndexOffset: 10000,
            display: this
        };
        
        this.clients[data.clientid] = client;

        client.marker = L.marker(pos, {
            icon: B.redMarker
        }).addTo(this.map).on("click", this._client_click.bind(client));

        this._clientContainer.addMarker(client.marker);

        if(!this.inDevice()) {
            client.marker.bindPopup(data.name);
            
            client.removalTimer = setTimeout(function() {
                self._clientContainer.unspiderfy();
                self._clientContainer.removeMarker(client.marker);
                
                self.map.removeLayer(client.marker);
                client.marker = null;
                client.removalTimer = null;
                
                delete self.clients[client.clientid];
            }, 10 * 60 * 1000);
        }
    },
    
    _client_click: function() {
        if(this.display.inDevice()) {
            this.display.getAppProxy().send("click", {
                major: this.major,
                minor: this.minor
            });

            return false;
        }
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
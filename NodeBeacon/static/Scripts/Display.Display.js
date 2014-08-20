/* jshint browser:true, undef: true, unused: true */
/* global $, L, B, OverlappingMarkerSpiderfier */
/* exported Display */

function Display() {
    var qs = B.getQuerystring();
    
    this.zoomOffset = 15;
    this.scalar = 0x4c10;
    this._in_device = qs.ios ? true : false;
    this._in_tv = qs.tv ? true : false;
    this.myClientId = qs.clientid;
    this.labels = [];
    this.beacons = [];
    this.markers = [];
    this.map = null;
    this.zoomOffset = 15;
    this.floor = 7;
    this.mainuuid = "2f73d96d-f86e-4f95-b88d-694cefe5837f";
    this.layers = {};
    
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

        var layers = ['Creative', 'Editorial', 'Labs', 'pm', 'web_app_dev'];
        
        for(var i = 0; i < layers.length; i++) {
            var layer = L.tileLayer('/Content/maps/7th_' + layers[i] + '/{z}/{x}/{y}.png', layerOpts);
            this.layers[layers[i]] = layer;
        }
        
        
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
                this._socket.on('marker', this._msg_marker, this);
                this._socket.on('marker_deleted', this._msg_marker_deleted, this);
                this._socket.open();
            }
        }.bind(this));
        
        if(this.editable()) {
            this.initializeEditors();
        }
    },
    
    focusOnClient: function(clientID, alsoClick) {
        
        clientID = clientID.toLowerCase();
        
        var client = this.clients[clientID];
        
        this.map.panTo(client.marker.getLatLng(), {
            animate: true
        });
        
        if(alsoClick) client.marker.openPopup();
        
    },
    
    _loadBeacons: function(whenDone) {
        var self = this;
        
        if(!this.editable()) return;
        B.getBeacons("2f73d96d-f86e-4f95-b88d-694cefe5837f", this.floor, function (beacons) {
            self.beacons = beacons;

            if(whenDone)
                whenDone.apply(self);
        });


    },
    
    _onBeaconsLoaded: function()
    {
        for(var i = 0; i < this.beacons.length; i++) {
            var b = this.beacons[i];
            b.marker = this._createBeaconFromData(b);
            this.map.addLayer(b.marker);
        }
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
            icon: B.infoMarker
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
    
    _createBeaconFromData: function(data) {
        var ret = L.marker([data.latitude, data.longitude], {
            draggable: this.editable()
        });
        
        //ret.bindPopup(data.title);
        ret.rawData = data;
        ret.display = this;
        
        if(this.editable()) {
            ret.on('dragend', this._onBeaconDragEnd);
            ret.on('click', this._onBeaconClick);
        }
        
        return ret;
    },
    
    _onBeaconClick: function() {
        if(this.rawData.layer) {
            this.display.showLayer(this.rawData.layer);
        }
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
            dragable: this.editable()
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
    
    _onBeaconDragEnd: function()
    {
        //this, in this case, is the marker
        var latlng = this.getLatLng();
        this.rawData.latitude = latlng.lat;
        this.rawData.longitude = latlng.lng;
        
        B.saveBeacon(this.rawData, function() {
            
        });
        
    },
    
    _msg_client: function(data) {
        //data = data;
        var self = this;
        
        console.log("adding client " + data.name);
        
        this._clientContainer.unspiderfy();
        
        data.clientid = data.clientid.toLowerCase();
        
        var client = this.clients[data.clientid];

        if(client) {
            this._clientContainer.removeMarker(client.marker);
            this.map.removeLayer(client.marker);
            delete this.clients[data.clientid];
        }
        
        var beacon = null;
        
        if(data.uuid) {
            for(var b in this.beacons) {
                if(b.uuid == data.uuid && b.major == data.major && b.minor == data.minor) {
                    beacon = b;
                    break;
                }
            }
        }
        
        if(data.latitude !== null) {
            var pos = L.latLng(data.latitude, data.longitude);

            client = {
                clientid: data.clientid,
                marker: null,
                zIndexOffset: 10000,
                display: this
            };

            this.clients[data.clientid] = client;

            client.marker = L.marker(pos, {
                icon: B.manMarker
            }).addTo(this.map);

            this._clientContainer.addMarker(client.marker);
            
            //FIXME: I hope there aren't multiple clients here
            //this._clientContainer.spiderfy([client.marker]);
            
            client.marker.bindPopup(data.name);

            client.removalTimer = setTimeout(function() {
                self._clientContainer.unspiderfy();
                self._clientContainer.removeMarker(client.marker);

                self.map.removeLayer(client.marker);
                client.marker = null;
                client.removalTimer = null;

                delete self.clients[client.clientid];
            }, 10 * 60 * 1000);

            if(client.clientid == this.myClientId) {
                this.focusOnClient(client.clientid);
                if(beacon) this.showLayer(beacon.rawData.layer);
            }
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
    
    _findBeacon: function(major, minor) {
        var ret = null;
        
        this.beacons.every(function(b) {
            if(b.major == major && b.minor == minor) {
                ret = b;
                return false;
            }
            return true;
        });
        return ret;
    },
    
    _deleteBeacon: function(major, minor) {
        var ret = null;
        this.beacons.every(function(b, i) {
            if(b.major == major && b.minor == minor) {
                ret = b;
                this.beacons.splice(i, 1);
                return false;
            }
            return true;
        }, this);
        return ret;
    },
    
    _msg_beacon: function(data) {
        console.log("Adding/updating beacon");
        data = data;

        //do we know about this beacon already?
        var b = this._deleteBeacon(data.beacon.major, data.beacon.minor);

        

        if(b) {
            console.log("Existing beacon, removing it and adding a new one");
            //we just need to update some incidentals

            this.map.removeLayer(b.marker);
            //it was removed from the beacons array by _deleteBeacon
        }
        
        if(data.beacon.latitude && this.editable()) {
            data.beacon.marker = this._createBeaconFromData(data.beacon);
            this.map.addLayer(data.beacon.marker);
            this.beacons.push(data.beacon);
        }
        
        

    },
    
    _msg_marker: function(data) {
        console.log("Adding/updating marker");
        data = data;
        
        for(var i = 0; i < this.markers.length; i++) {
            if(this.markers[i].rawData._id === data.marker._id) {
                this.map.removeLayer(this.markers[i]);
                this.markers[i] = this._createMarkerFromData(data.marker);
                this.map.addLayer(this.markers[i]);
                return;
            }
        }
        
        //no existing marker, create one
        var newMarker = this._createMarkerFromData(data.marker);
        this.markers.push(newMarker);
        this.map.addLayer(newMarker);
        
        
    },
    
    _msg_marker_deleted: function(data) {
        console.log("Removing marker");
        for(var i = 0; i < this.markers.length; i++) {
            if(this.markers[i].rawData._id === data.marker_id) {
                this.map.removeLayer(this.markers[i]);
                this.markers.splice(i, 1);
                return;
            }
        }
    },
    
    showLayer: function(l) {
        
        for(var i in this.layers) {
            var layer = this.layers[i];
            if(l == i) {
                if(!this.map.hasLayer(layer)) {
                    this.map.addLayer(layer);
                }
            } else {
                if(this.map.hasLayer(layer)) {
                    this.map.removeLayer(layer);
                }
            }
        }
        
    }
    
};
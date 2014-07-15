window.beacon = function (beacon_id, major, minor, device_id, proximity) {

    beacon_id = beacon_id.toLowerCase();
    
    if (beacon_id == "00000000-0000-0000-0000-000000000000" || beacon_id == "(null)") {
        beacon_id = null;
    }

    proximity = parseInt(proximity, 10);

    if (window.beacon_func) {
        window.beacon_func(beacon_id, major, minor, device_id, proximity);
    }

};

window.didEnterForeground = function () {
    if (window.didEnterForeground_func) {
        window.didEnterForeground_func();
    }
};

B = (function () {
    return {
        me: null,

        getName: function () {
            jQuery.ajax({
                type: "GET",
                url: "/client/me",
                dataType: "json",
                complete: function (data) {
                    B.me = data.responseJSON;
                    
                    if (!B.me.name) {
                        var name = prompt("What is your name?");

                        if (name) {
                            B.me.name = name;

                            jQuery.ajax({
                                type: "PUT",
                                url: "/client/me/name",
                                data: { name: name }
                            });
                        }
                    }
                }
            });
        },

        getBeacons: function (uuid, major, whenLoaded) {
            if (typeof (uuid) == "function") {
                whenLoaded = uuid;
                uuid = null;
            }
            if (!whenLoaded) return; //the whole point of this is to load data and call a callback!

            var url = "/beacon/flat";

            if (uuid) {
                url += "/" + uuid;
            }

            if (major) {
                url += "/" + major;
            }

            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                complete: function (response) {
                    whenLoaded(response.responseJSON);
                }
            });

        },

        getBeaconsDict: function (uuid, major, whenLoaded) {
            if (typeof (uuid) == "function") {
                whenLoaded = uuid;
                uuid = null;
            }
            if (!whenLoaded) return; //the whole point of this is to load data and call a callback!

            var url = "/beacon";

            if (uuid) {
                url += "/" + uuid;
            }

            if (major) {
                url += "/" + major;
            }

            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                complete: function (response) {
                    whenLoaded(response.responseJSON);
                }
            });
        },

        getActiveClients: function (major, whenLoaded) {
            if (typeof major == "function") {
                whenLoaded = major;
                major = null;
            }

            if (!whenLoaded) return; //the whole point of this is to load data and call a callback!

            var url = "/client/all";

            if (major) {
                url += "?major=" + major;
            }

            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                complete: function (response) {
                    whenLoaded(response.responseJSON);
                }
            });

        },

        getClient: function (clientid, major, whenLoaded) {
            if (typeof major == "function") {
                whenLoaded = major;
                major = null;
            }

            if (!whenLoaded) return; //the whole point of this is to load data and call a callback!

            var url = "/client/" + clientid;

            if (major) {
                url += "?major=" + major;
            }

            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                complete: function (response) {
                    whenLoaded(response.responseJSON);
                }
            });
        },

        redMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                    labelAnchor: [0, 0],
                    iconUrl: "/Content/images/red-marker.png",
                    iconRetinaUrl: "/Content/images/red-marker-2x.png",
                });
            }
        })(),
        
        getPrefs: function(withPrefs) {
            if(this.prefs) {
                withPrefs(this.prefs);
                return;
            }
            
            $.ajax({
                type: "GET",
                url: "/prefs",
                dataType: "json",
                complete: function(response) {
                    this.prefs = response.responseJSON;
                    withPrefs(this.prefs);
                }   
            });
        },
        
        saveBeacon: function(beacon, onDone) {
            $.ajax({
                url: "/beacon",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(beacon),
                dataType: "json",
                complete: function(response) {
                    if(onDone) onDone(response.responseJSON);
                }
            });
        },
        
        SimpleLabel: L.Class.extend({
            options: {
                minZoom: 0,
                maxZoom: 1000,
                text: "My Label",
                fontSize: "18px",
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white"
                
            },
            initialize: function (latlng, options) {
                // save position of the layer or any options from the constructor
                this._latlng = latlng;
                
                L.Util.setOptions(this, options);
                this._manuallyHidden = false;
                
                var testElement = document.getElementById("Test");
                if(!testElement) {
                    testElement = L.DomUtil.create('div', '');
                    testElement.id = "Test";
                    document.body.appendChild(testElement);
                }
                
            },

            onAdd: function (map) {
                this._map = map;

                // create a DOM element and put it into one of the map panes
                this._el = L.DomUtil.create('div', 'simple-label-layer leaflet-zoom-hide');
                
                $(this._el).text(this.options.text).css({
                    fontSize: this.options.fontSize,
                    backgroundColor: this.options.backgroundColor,
                    color: this.options.color
                });
                
                var testElement = document.getElementById("Test");
                testElement.style.fontSize = this.options.fontSize;
                $(testElement).text(this.options.text);
                var width = (testElement.clientWidth + 6);
                
                $(this._el).css({
                    width: width + "px",
                    marginLeft: -(width / 2) + "px"
                });
                
                map.getPanes().overlayPane.appendChild(this._el);

                // add a viewreset event listener for updating layer's position, do the latter
                map.on('viewreset', this._reset, this);
                this._reset();
            },

            onRemove: function (map) {
                // remove layer's DOM elements and listeners
                map.getPanes().overlayPane.removeChild(this._el);
                map.off('viewreset', this._reset, this);
            },

            _reset: function () {
                if(this._manuallyHidden) {
                    return;
                }
                var zoom = this._map.getZoom();
                if(zoom < this.options.minZoom || zoom > this.options.maxZoom) {
                    $(this._el).hide();
                } else {
                    $(this._el).show();
                }
                // update layer's position
                var pos = this._map.latLngToLayerPoint(this._latlng);
                L.DomUtil.setPosition(this._el, pos);
            },
            
            move: function(latlng) {
                this._latlng = latlng;
                this._reset();
            },
            
            setText: function(text) {
                $(this._el).text(text);
            },
            
            setMinZoom: function(z) {
                this.options.minZoom = z;
                this._reset();
            }
        })

    };

})();
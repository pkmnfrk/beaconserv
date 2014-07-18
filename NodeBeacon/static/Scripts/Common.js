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
    var ret = {
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
        
        animatedMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [40, 60],
                    iconAnchor: [0, 55],
                    popupAnchor: [20, -50],
                    labelAnchor: [0, 0],
                    iconUrl: "/Content/images/animated-marker.gif",
                    iconRetinaUrl: "/Content/images/animated-marker-2x.gif"
                });
            }
        })(),
        
        bigMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [67, 145],
                    iconAnchor: [33, 144],
                    popupAnchor: [1, -34],
                    shadowSize: [127, 96],
                    shadowAnchor: [8, 90],
                    labelAnchor: [0, 0],
                    iconUrl: "/Content/images/pink-marker.png",
                    shadowUrl: "/Content/images/pink-marker_Shadow.png"
                    //iconRetinaUrl: "/Content/images/red-marker-2x.png",
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
            var marker = beacon.marker;
            beacon.marker = undefined;
            
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
            
            beacon.marker = marker;
        },
        
        deleteBeacon: function(beacon, onDone) {
            var marker = beacon.marker;
            beacon.marker = undefined;
            
            $.ajax({
                url: "/beacon/" + beacon.uuid + "/" + beacon.major + "/" + beacon.minor,
                type: "DELETE",
                complete: function(response) {
                    if(onDone) onDone();
                }
            });
            
            beacon.marker = marker;
        },

        getLabels: function(floor, onDone)
        {
            var url = "/map/labels";
            if(floor)
                url += "/" + floor;
            
            
            $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                complete: function(response)
                {
                    if(onDone) onDone(response.responseJSON);
                }
            });
        },
        
        storeLabel: function(label, onDone)
        {
            $.ajax({
                url: "/map/label",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(label),
                complete: function(response)
                {
                    
                    if(onDone) onDone();
                }
            });
        },
        
        getMarkers: function (floor, whenLoaded) {
            if (typeof (floor) == "function") {
                whenLoaded = floor;
                floor = null;
            }
            if (!whenLoaded) return; //the whole point of this is to load data and call a callback!

            var url = "/map/markers";
            if(floor) url += "/" + floor;
            
            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                complete: function (response) {
                    whenLoaded(response.responseJSON);
                }
            });

        },
        
        storeMarker: function(marker, onDone)
        {
            $.ajax({
                url: "/map/marker",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(marker),
                complete: function(response)
                {
                    
                    if(onDone) onDone(response.responseJSON);
                }
            });
        }

    };
    
    ret.AppProxy = function(tag) {
        this._tag = tag;
        this._cbid = 1;
    };
    
    ret.AppProxy.prototype = {
        send: function(action, params, callback) {
            
            if(typeof params === "function") {
                callback = params;
                params = null;
            }

            if(callback && typeof callback === "function") {
                var cbid = this._tag + "_callback_" + (this._cbid++);
                window[cbid] = callback;
                if(!params) {
                    params = {};
                }
                
                params[callback] = cbid;
            }

            var url = this._tag + "://" + action;

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
        }

    };
    
    return ret;

})();
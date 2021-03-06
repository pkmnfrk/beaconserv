/*jshint undef: true, unused:true, browser:true, jquery: true */
/*globals L, prompt */
/* exports B */

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

var B = (function () {
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
                    iconAnchor: [20, 55],
                    popupAnchor: [0, -50],
                    labelAnchor: [0, 0],
                    iconUrl: "/Content/images/animated-marker.gif",
                    iconRetinaUrl: "/Content/images/animated-marker-2x.gif"
                });
            }
        })(),
        
        bigMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [34, 73],
                    iconAnchor: [16, 72],
                    popupAnchor: [1, -17],
                    shadowSize: [63, 48],
                    shadowAnchor: [3, 45],
                    labelAnchor: [0, 0],
                    iconUrl: "/Content/images/pink-marker.png",
                    iconRetinaUrl: "/Content/images/pink-marker@2x.png",
                    shadowUrl: "/Content/images/pink-marker_Shadow.png"
                    //iconRetinaUrl: "/Content/images/red-marker-2x.png",
                });
            }
        })(),
        
        infoMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [51, 51],
                    iconAnchor: [25, 25],
                    popupAnchor: [0, -25],
                    labelAnchor: [0, -25],
                    iconUrl: "/Content/images/Info.png",
                    iconRetinaUrl: "/Content/images/Info@2x.png"
                    //iconRetinaUrl: "/Content/images/red-marker-2x.png",
                });
            }
        })(),
        
        manMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [33, 83],
                    iconAnchor: [16, 99],
                    popupAnchor: [0, -79],
                    labelAnchor: [0, -79],
                    iconUrl: "/Content/images/ManDude.png",
                    iconRetinaUrl: "/Content/images/ManDude@2x.png"
                    //iconRetinaUrl: "/Content/images/red-marker-2x.png",
                });
            }
        })(),
        
        smallManMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [21, 47],
                    iconAnchor: [10, 65],
                    popupAnchor: [0, -65],
                    labelAnchor: [0, -47],
                    iconUrl: "/Content/images/SmallManDude.png",
                    iconRetinaUrl: "/Content/images/SmallManDude@2x.png"
                    //iconRetinaUrl: "/Content/images/red-marker-2x.png",
                });
            }
        })(),
        
        tvManMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [21, 47],
                    iconAnchor: [10, 65],
                    popupAnchor: [0, -65],
                    labelAnchor: [0, -47],
                    iconUrl: "/Content/images/mapManDude.png",
                    iconRetinalUrl: "/Content/images/mapManDude@2x.png",
                    
                    //iconRetinaUrl: "/Content/images/red-marker-2x.png",
                });
            }
        })(),
        
        mySmallManMarker: (function () {
            if (typeof window.L !== "undefined") {
                return L.icon({
                    iconSize: [27, 47],
                    iconAnchor: [10, 65],
                    popupAnchor: [0, -65],
                    labelAnchor: [0, -47],
                    iconUrl: "/Content/images/MySmallManDude.png",
                    iconRetinaUrl: "/Content/images/MySmallManDude@2x.png"
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
                complete: function() {
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
                    
                    if(onDone) onDone(response.responseJSON);
                }
            });
        },
        
        deleteLabel: function(label, onDone)
        {
            if(!label._id) {
                if(onDone) onDone();
                return;
            }
            
            $.ajax({
                url: "/map/label/" + label._id,
                type: "DELETE",
                complete: function()
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
        },
        
        deleteMarker: function(marker, onDone)
        {
            if(!marker._id) {
                if(onDone) onDone();
                return;
            }
            
            $.ajax({
                url: "/map/marker/" + marker._id,
                type: "DELETE",
                complete: function()
                {
                    
                    if(onDone) onDone();
                }
            });
        },

        drawPieChartThing: function(element, options) {
            var defaults = {
                color: '#808080',
                innerLabel: '',
                outerLabel: '',
                outerRadius: 176,
                innerRadius: 80,
                percentage: 10,
                drawPercentage: 0
            };
            
            if(options) {
                for(var o in options) {
                    defaults[o] = options[o];
                }
            }
            
            var can = document.getElementById(element);
            var con = can.getContext("2d");
            
            can.width = can.width; //clear the canvas
            
            defaults.percentage = ( defaults.percentage / 100);
            defaults.drawPercentage = defaults.drawPercentage ? ( defaults.drawPercentage / 100) : 0;
            
            //var mx = can.width / 2;
            var my = can.height / 2;
            var pad = can.height - (defaults.outerRadius * 2);
            var startAngle = 0 - Math.PI / 4 - (Math.PI * 2 * defaults.drawPercentage);
            var endAngle = Math.PI * 2 - (Math.PI * 2 * defaults.percentage) - Math.PI / 4;
            
            var mx = pad + defaults.outerRadius;
            
            con.fillStyle = defaults.color;
            
            con.globalAlpha = 0.5;
            
            con.beginPath();
            con.arc(mx, my, defaults.outerRadius, 0, Math.PI * 2, true);
            con.arc(mx, my, defaults.innerRadius, 0, Math.PI * 2, false);
            con.fill();
            
            con.globalAlpha = 1;
            con.beginPath();
            con.arc(mx, my, defaults.outerRadius, startAngle, endAngle, true);
            con.arc(mx, my, defaults.innerRadius, endAngle, startAngle, false);
            //con.closePath();
            
            con.fill();
            
            con.font = '400 18pt Helvetica Neue';
            
            con.fillStyle = 'white';
            
            if(defaults.innerLabel) {
                con.textAlign = 'center';
                con.fillText(defaults.innerLabel, mx, my + 8);
            }
            if(defaults.outerLabel) {
                con.textAlign = 'left';
                B.wrapText(con, defaults.outerLabel, mx + defaults.outerRadius + 12, my - defaults.outerRadius + 28, can.width - pad - defaults.outerRadius * 2 - 12, 25);
                

                con.beginPath();
                
                con.arc(mx, my, defaults.outerRadius, startAngle, startAngle, false);
                con.lineTo(mx + defaults.outerRadius - 20.5, my - defaults.outerRadius + 20.5);
                con.lineTo(mx + defaults.outerRadius + 2.5, my - defaults.outerRadius + 20.5);
                
                con.strokeStyle = defaults.color;
                con.lineWidth = 2;
                con.stroke();
                
                
            }

            
        },
        
        animateChart: function (canv, perc) {
            var tempPerc = {};
            for(var i in perc) {
                tempPerc[i] = perc[i];
            }
            tempPerc.drawPercentage = tempPerc.percentage;
            tempPerc.outerLabel = null;
            var speed = 25;
            
            var frame = function() {
                if(tempPerc.drawPercentage <= 0) {
                    B.drawPieChartThing(canv, perc);
                    return;
                }
                
                tempPerc.drawPercentage -= 1;
                
                
                B.drawPieChartThing(canv, tempPerc);
                
                setTimeout(frame, speed);
            };
            
            setTimeout(frame, 500);
        },
        
        wrapText: function(context, text, x, y, maxWidth, lineHeight) {
            var words = text.replace(/\n/g, " {newLine} ");
            //console.log("Operating on " + words);
            words = words.split(' ');
            var line = '';

            for(var n = 0; n < words.length; n++) {
                if(words[n] == "{newLine}") {
                    if(line) {
                        console.log("printing: " + line);
                        context.fillText(line, x, y);
                        line = '';
                    }
                    y += lineHeight;
                } else {
                    var testLine = line + words[n] + ' ';
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        //console.log("printing: " + line);
                        context.fillText(line, x, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    }
                    else {
                        line = testLine;
                    }
                }
            }
            //console.log("printing: " + line);
            context.fillText(line, x, y);
        },
        getQuerystring: function() {
            var qs2 = {}, querystring = window.location.search.substring(1);

            querystring = querystring.split('&');
            for(var i = 0; i < querystring.length;i++) {
                var itm = querystring[i].split('=');
                if(itm.length > 1) {
                    qs2[decodeURIComponent(itm[0]).toLowerCase()] = decodeURIComponent(itm[1]);
                } else {
                    qs2[decodeURIComponent(itm[0]).toLowerCase()] = true;
                }
            }

            return qs2;
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

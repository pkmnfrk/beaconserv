
B.DisplayView = L.Class.extend({
    options: {
        map: null
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    stop: function () {

    },

    start: function (whenDone) {
        whenDone();
    },
});

B.DisplayView.TraceClientPaths = B.DisplayView.extend({
    initialize: function (options) {
        B.DisplayView.prototype.initialize.call(this, options);
    },

    whenDone: null,

    animatedMarker: null,
    poly: null,
    marker: null,
    timeout: null,

    stop: function() {
        if (this.animatedMarker) {
            this.animatedMarker.stop();
            this.map.removeLayer(this.animatedMarker)
            this.animatedMarker = null;
        }

        if (this.poly) {
            this.map.removeLayer(this.poly);
            this.poly = null;
        }

        if (this.marker) {
            this.map.removeLayer(this.marker);
            this.marker = null;
        }

        if (self.timeout) {
            clearTimeout(self.timeout);
            self.timeout = null;
        }
    },

    start: function (whenDone) {
        var self = this;

        var animationIndex = 0;
        this.whenDone = whenDone;

        B.getActiveClients(7, function addClient(clients) {
            var nextClient = function () {
                if (animationIndex >= clients.length) {
                    
                    whenDone();

                } else {
                    addClient(clients);
                }
            };

            if (clients.length) {
                var client = clients[animationIndex++];
                if (!client.name) client.name = "Unnamed";

                B.getClient(client.clientID, 7, function (clientData) {

                    var coords = [];
                    for (var i = 0; i < clientData.beaconPings.length; i++) {
                        var b = clientData.beaconPings[i].beacon;

                        coords.push([b.latitude / scalar, b.longitude / scalar]);
                    }

                    if (clientData.beaconPings.length > 1) {


                        self.poly = L.polyline(coords, { color: 'red' })

                        self.poly.addTo(self.options.map);

                        self.animatedMarker = L.animatedMarker(self.poly.getLatLngs(), {
                            distance: 15,
                            interval: 1000,
                            autoStart: false,
                            icon: B.redMarker,
                            onEnd: function () {
                                setTimeout(function () {
                                    self.options.map.removeLayer(self.poly);
                                    self.options.map.removeLayer(self.animatedMarker);

                                    nextClient();



                                }, 5000);
                            }
                        }).bindLabel(client.name, {
                            noHide: true
                        });

                        self.options.map.addLayer(self.animatedMarker);

                        self.timeout = setTimeout(function () { self.animatedMarker.start() }, 100);


                    } else if (clientData.beaconPings.length == 1) {
                        self.marker = L.marker(coords[0], {
                            icon: B.redMarker
                        })
                            .bindLabel(client.name, {
                                noHide: true
                            })
                            .addTo(self.options.map);


                        setTimeout(function () {
                            self.options.map.removeLayer(self.marker);

                            nextClient();



                        }, 5000);
                    } else {

                        nextClient();

                    }

                });
            }
        });
    }

})
function MainViewModel() {
    var self = this;

    self.cards = ko.observableArray([]);

    var isMobile = navigator.userAgent.indexOf("Mobile") != -1;

    self.displayMode = function (item) {
        if (item.video) {
            if (isMobile) {
                return "mobile_card_video";
            } else {
                return "desktop_card_video";
            }
        }
        if (item.image) {
            return "card_image";
        }
        return "card_no_image";
    };

    window.addTest = function () {
        var major = prompt("Major", "4");
        if (major !== null) {
            var minor = prompt("Minor", "1");
            if (minor !== null) {
                var proximity = prompt("Proximity", "2");
                if (proximity !== null) {
                    beacon("2F73D96D-F86E-4F95-B88D-694CEFE5837F", major, minor, "123456", proximity);
                }
            }
        }
    };

    self.previousBeacon = ko.observable();

    window.refresh = function () {
        window.location.href = window.location.href;
    };

    self.onPlay = function (model, evt) {
        $(evt.currentTarget).addClass("fadeToDark").removeClass("fadeFromDark");
    };

    self.onEnded = function (model, evt) {
        $(evt.currentTarget).addClass("fadeFromDark").removeClass("fadeToDark");
    };

    self.addCardSwipe = function (elements, obj) {
        return;
        /*var el = elements[0].parentElement;
        $(el).touchwipe({
            wipeRight: function (e) {
                $(el).css("position", "relative").animate({
                    left: screen.width + "px"
                }, function () {
                    self.cards.remove(obj)
                })
            },
            preventDefaultEvents: false,
        });
        */
    };

    self.callBeacon = function(beacon_id, major, minor, device_id, proximity) {
        if (!proximity) proximity = 4;

        if (beacon_id === null) {
            return;
        }

        if (self.previousBeacon()) {
            if(
                self.previousBeacon().uuid == beacon_id &&
                self.previousBeacon().major == major    &&
                self.previousBeacon().minor == minor)
            {
                return;
            }
        }

        jQuery.ajax({
            type: "POST",
            url: "/ping/" + beacon_id + "/" + major + "/" + minor + "?proximity=" + proximity,
            data: { device_id: device_id },
            dataType: "json",
            complete: function (datar, textStatus) {
                var data = datar.responseJSON;

                //if (data.maxProximity === 0 || proximity <= data.maxProximity) {

                    data.proximity = proximity;

                    self.previousBeacon(data);

                    self.cards.unshift(data);

                //}

            }
        });
    };
    
    self.beaconCycles = [
        ["2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, 5, 4, 1],    
        ["2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, 6, 4, 1],
        //["2f73d96d-f86e-4f95-b88d-694cefe5837f", 7, 7, 4, 1]
    ];
    
    var currentBeacon = -1;
        var faking = false;
        
    window.onFake = function() {
        if(faking) return;
        faking = true;
        
        setTimeout(function() {
            self.callBeacon.apply(this, self.beaconCycles[0]);
            setTimeout(function() {
                self.callBeacon.apply(this, self.beaconCycles[1]);
            }, 10000);
        }, 10000);
/*        currentBeacon++;
        

        if(currentBeacon >= self.beaconCycles.length) {
            currentBeacon = 0;
        }
        
        self.callBeacon.apply(this, self.beaconCycles[currentBeacon]);*/
    };
        
    window.beacon_func = function (beacon_id, major, minor, device_id, proximity) {

        //do nothing
    };

    window.clearBeacons = function () {
        $.ajax({
            url: "/state/clear",
            type: "POST",
            complete: function () {
                self.cards.removeAll();
                self.previousBeacon(null);
            }
        });
    };

    B.getName();

    //load existing pings
    $.ajax({
        url: "/state",
        type: "GET",
        dataType: "json",
        complete: function (datar) {
            var data = datar.responseJSON;
            for (var i = 0; i < data.length; i++) {
                data[i].beacon.proximity = data[i].proximity;
                self.cards.push(data[i].beacon);
            }

            if (data.length > 0) {
                self.previousBeacon(data[0].beacon);
            }

        }
    });

    setTimeout(function() {
        self.callBeacon.apply(this, self.beaconCycles[1]);
    }, 1000);

    
}

ko.applyBindings(new MainViewModel());

$("html").click(window.onFake);
$("html").on("touchstart", window.onFake);

/*$("#hook").hook({
    swipeDistance: 150
});*/
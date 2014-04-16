function MainViewModel() {
    var self = this;

    self.cards = ko.observableArray([]);

    var isMobile = navigator.userAgent.indexOf("Mobile") != -1;

    self.displayMode = function (item) {
        if (item.video) {
            if (isMobile) {
                return "mobile_card_video";
            } else {
                return "desktop_card_video"
            }
        }
        if (item.image) {
            return "card_image";
        }
        return "card_no_image";
    }

    window.addTest = function () {
        var major = prompt("Major", "4");
        if (major != null) {
            var minor = prompt("Minor", "1");
            if (minor != null) {
                var proximity = prompt("Proximity", "2");
                if (proximity != null) {
                    beacon("2F73D96D-F86E-4F95-B88D-694CEFE5837F", major, minor, "123456", proximity);
                }
            }
        }
    }

    self.previousBeacon = ko.observable();

    window.refresh = function () {
        window.location.href = window.location.href;
    }

    self.onPlay = function (model, evt) {
        $(evt.currentTarget).addClass("fadeToDark").removeClass("fadeFromDark");
    };

    self.onEnded = function (model, evt) {
        $(evt.currentTarget).addClass("fadeFromDark").removeClass("fadeToDark");
    };

    self.addCardSwipe = function (elements, obj) {
        return;
        var el = elements[0].parentElement;
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
    }

    window.beacon = function (beacon_id, major, minor, device_id, proximity) {

        beacon_id = beacon_id.toLowerCase();

        proximity = parseInt(proximity, 10);

        if (!proximity) proximity = 4;

        if (beacon_id == "00000000-0000-0000-0000-000000000000" || beacon_id == "(null)") {
            return;
        }

        if (self.previousBeacon()) {
            if(
                self.previousBeacon().beacon_id == beacon_id
                && self.previousBeacon().major == major
                && self.previousBeacon().minor == minor)
            {
              //  if (self.previousBeacon().proximity <= self.previousBeacon().maxProximity
              //     || proximity >= self.previousBeacon().proximity) {
                    // if (self.previousBeacon().maxProximity != 0 && proximity > self.previousBeacon().maxProximity) {
                    return;
                    //}
              //  }
            }
        }

        /*
        self.cards.unshift({
            title: "DEBUG",
            body: "ID: " + major + "." + minor + "\nProximity:" + proximity,
            url: null,
            image: null,
            video: null,
            proximity: -1
        })
        */

        jQuery.ajax({
            type: "POST",
            url: "/state/ping/" + beacon_id + "/" + major + "/" + minor,
            data: { device_id: device_id },
            dataType: "json",
            complete: function (datar, textStatus) {
                var data = datar.responseJSON;

                if (data.maxProximity == 0 || proximity <= data.maxProximity) {

                    self.previousBeacon({
                        beacon_id: data.uuid,
                        major: data.major,
                        minor: data.minor,
                        maxProximity: data.maxProximity,
                        proximity: proximity
                    });

                    self.cards.unshift({
                        title: data.title,
                        body: data.bodyText,
                        url: data.url,
                        image: data.image,
                        video: data.video,
                        proximity: proximity
                    });

                }


                /*
                self.cards.push({
                    title: "Beacon",
                    uuid: beacon_id,
                    major: major,
                    minor: minor,
                    device_id: device_id
                })*/
            }
        });
    };

    window.clearBeacons = function () {
        jQuery.ajax({
            url: "/state/clear",
            type: "POST",
            complete: function () {
                self.cards.removeAll();
            }
        })
    }

    //load existing pings
    jQuery.ajax({
        url: "/state",
        type: "GET",
        dataType: "json",
        complete: function (datar) {
            var data = datar.responseJSON;
            for (var i = 0; i < data.length; i++) {
                self.cards.push(data[i]);
            }

            if (data.length > 0) {
                self.previousBeacon({
                    beacon_id: data[0].uuid,
                    major: data[0].major,
                    minor: data[0].minor,
                    maxProximity: data[0].maxProximity,
                    proximity: 0
                });
            }

        }
    });
}

ko.applyBindings(new MainViewModel());

/*$("#hook").hook({
    swipeDistance: 150
});*/
﻿function MainViewModel() {
    var self = this;

    self.cards = ko.observableArray([

    ]);

    self.displayMode = function (item) {
        if (item.image) return "card_image";
        return "card_no_image";
    }

    self.addTest = function () {
        var major = prompt("Major", "4");
        var minor = prompt("Minor", "1");
        beacon("2F73D96D-F86E-4F95-B88D-694CEFE5837F", major, minor, "123456");
    }

    self.previousBeacon = ko.observable();

    window.beacon = function (beacon_id, major, minor, device_id, proximity) {

        beacon_id = beacon_id.toLowerCase();
        proximity = proximity || 0;

        if (self.previousBeacon()) {
            if(
                self.previousBeacon().beacon_id == beacon_id
                && self.previousBeacon().major == major
                && self.previousBeacon().minor == minor)
            {
                if (proximity > self.previousBeacon().maxProximity) {
                    return;
                }
            }
        }

        jQuery.getJSON("/beacon/" + beacon_id + "/" + major + "/" + minor, { device_id: device_id }, function (data, textStatus) {

            self.previousBeacon({
                beacon_id: data.uuid,
                major: data.major,
                minor: data.minor,
                maxProximity: data.maxProximity
            });

            if (proximity <= data.maxProximity) {

                self.cards.unshift({
                    title: data.title,
                    body: data.bodyText,
                    url: data.url,
                    image: data.image
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
        });

    };
}

ko.applyBindings(new MainViewModel());

function MainViewModel() {
    var self = this;

    self.cards = ko.observableArray([

    ]);

    self.displayMode = function (item) {
        if (item.image) return "card_image";
        return "card_no_image";
    }

    self.addTest = function () {
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

    self.refresh = function () {
        window.location.href = window.location.href;
    }

    window.beacon = function (beacon_id, major, minor, device_id, proximity) {

        beacon_id = beacon_id.toLowerCase();

        proximity = parseInt(proximity, 10);

        if (!proximity) proximity = 4;

        /*
        self.cards.unshift({
            title: "DEBUG",
            body: "ID: " + major + "." + minor + "\nProximity:" + proximity,
            url: null,
            image: null
        })
        */

        if (self.previousBeacon()) {
            if(
                self.previousBeacon().beacon_id == beacon_id
                && self.previousBeacon().major == major
                && self.previousBeacon().minor == minor)
            {
               // if (self.previousBeacon().maxProximity != 0 && proximity > self.previousBeacon().maxProximity) {
                    return;
                //}
            }
        }

        jQuery.getJSON("/beacon/" + beacon_id + "/" + major + "/" + minor, { device_id: device_id }, function (data, textStatus) {

            self.previousBeacon({
                beacon_id: data.uuid,
                major: data.major,
                minor: data.minor,
                maxProximity: data.maxProximity
            });

            if (data.maxProximity == 0 || proximity <= data.maxProximity) {

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

/*$("#hook").hook({
    swipeDistance: 150
});*/
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
        var minor = prompt("Minor", "1");
        beacon("2F73D96D-F86E-4F95-B88D-694CEFE5837F", major, minor, "123456");
    }

    window.beacon = function (beacon_id, major, minor, device_id) {

        jQuery.getJSON("/beacon/" + beacon_id + "/" + major + "/" + minor, { device_id: device_id }, function (data, textStatus) {

            self.cards.unshift({
                title: data.title,
                body: data.bodyText,
                url: data.url,
                image: data.image
            });
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

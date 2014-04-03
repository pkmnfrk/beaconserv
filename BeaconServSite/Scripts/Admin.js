function AdminViewModel() {
    var self = this;

    self.beacons = ko.observableArray([]);
    self.addNew = function () {
        var newBeacon = {};

        newBeacon.uuid = ko.observable(self.beacons()[self.beacons().length - 1].uuid());
        newBeacon.major = ko.observable(null);
        newBeacon.minor = ko.observable(null);
        newBeacon.id = ko.observable("");
        newBeacon.title = ko.observable("");
        newBeacon.bodyText = ko.observable("");
        newBeacon.url = ko.observable("");
        newBeacon.image = ko.observable("");

        newBeacon.beaconid = makebeaconid(newBeacon);

        self.beacons.push(newBeacon);
    }

    self.removeImage = function (newBeacon, evt) {
        newBeacon.image(null);
    };

    self.save = function (newBeacon, evt) {
        var message = $(evt.currentTarget).next("span");
        message.text("Saving...").fadeIn();

        $(evt.currentTarget).attr("disabled", "disabled")

        self.uploadImage(newBeacon, evt, function () {

            var js = ko.toJS(newBeacon);

            jQuery.ajax({
                type: "POST",
                url: "/beacon/",
                data: js,
                success: function () {
                    $(evt.currentTarget).attr("disabled", null);
                    message.text("Saved!").fadeOut(2000);
                }
            });
        });
    };

    self.uploadImage = function (obj, evt, cont) {
        var form = $("form", $(evt.currentTarget).closest("table")[0])[0];
        var file = $("input[type='file']", form)[0];
        var formData = new FormData(form);

        if (!file.value) {
            if (cont) cont();
            return;
        }

        $.ajax({
            url: "/beacon/image",
            type: "POST",
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                obj.image(data);

                file.value = '';
                if (file.value) {
                    file.type = 'text';
                    file.type = 'file';
                }

                if(cont) cont();
            }
        });
    }
    


    var makebeaconid = function(to){
        return ko.computed({
            read: function () {
                return (to.major() || "*") + "." + (to.minor() || "*");
            },
            write: function (value) {
                var dot = value.lastIndexOf(".");
                if (dot > 0) {
                    var maj = value.substring(0, dot);
                    var min = value.substring(dot + 1);
                    if (maj == "*") maj = null;
                    if (min == "*") min = null;
                    to.major(maj);
                    to.minor(min);
                }
            }
        });
    }

    jQuery.getJSON("/beacon/", {}, function (data, status) {

        for (var i = 0; i < data.length; i++) {
            var to = data[i];

            for (var j in data[i]) {

                if (to.hasOwnProperty(j)) {
                    to[j] = ko.observable(to[j]);
                }
            }

            to.beaconid = makebeaconid(to);
        }
        self.beacons(data);

    });
}

ko.applyBindings(new AdminViewModel());

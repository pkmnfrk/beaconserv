function AdminViewModel() {
    var self = this;

    self.beacons = ko.observableArray([]);
    self.addNewUUID = function () {
        var uuid = prompt("What is the GUID?");
        if (!uuid) return;
        if (uuid == "-") uuid = null;

        var newUUID = {
            uuid: uuid,
            values: ko.observableArray()
        };

        self.beacons.push(newUUID);
    }

    self.addNewMajor = function (uuid) {
        var major = prompt("What is the major value?");
        if (!major) return;

        if (major == "-") major = null;

        var newMajor = {
            uuid: uuid.uuid,
            major: ko.observable(major),
            visible: ko.observable(true),
            values: ko.observableArray()
        };

        uuid.values.push(newMajor);
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

        var url = "/beacon/image";
        if (obj.uuid) {
            url += "?uuid=" + obj.uuid();
            if (obj.major) {
                url += "&major=" + obj.major();
                if (obj.minor) {
                    url += "&minor=" + obj.minor();
                }
            }
        }

        $.ajax({
            url: url,
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
    
    self.addNewMinor = function (majore, evt) {
        var newBeacon = {};

        majore.visible(true);

        newBeacon.uuid = ko.observable(majore.uuid);
        newBeacon.major = majore.major;
        newBeacon.minor = ko.observable(null);
        newBeacon.id = ko.observable("");
        newBeacon.title = ko.observable("");
        newBeacon.bodyText = ko.observable("");
        newBeacon.url = ko.observable("");
        newBeacon.image = ko.observable("");


        var newMinor = {
            minor: newBeacon.minor,
            value: newBeacon
        };

        majore.values.push(newMinor);

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

    function addObservables(obj) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (typeof (obj[i]) == "object") {
                    addObservables(obj[i]);
                }

                obj[i] = ko.observable(obj[i]);
            }
        }

        return obj;
    };

    self.expandMajor = function (majore, evt) {
        var arrow = $(evt.currentTarget);

        majore.visible(!majore.visible());
        /*
        if (!arrow.hasClass("open")) {
            //arrow[0].style.animation = "arrowRotateOpen 1s ease 0 1 normal";
            arrow
                .addClass("open")
                .removeClass("closed");
        } else {
            arrow
                .removeClass("open")
                .addClass("closed");
        }
        */

    }

    jQuery.getJSON("/beacon/", {}, function (data, status) {

        var newGuid, newMajor, newMinor;

        for (var g in data) {
            if (data.hasOwnProperty(g)) {

                newGuid = {
                    uuid: g,
                    values: ko.observableArray()
                };

                self.beacons.push(newGuid);
                
                for (var ma in data[g]) {

                    if (data[g].hasOwnProperty(ma)) {

                        newMajor = {
                            uuid: g,
                            major: ma,
                            visible: ko.observable(false),
                            values: ko.observableArray()
                        };

                        newGuid.values.push(newMajor)

                        for (var mi in data[g][ma]) {
                            if (data[g][ma].hasOwnProperty(mi)) {
                                newMinor = {
                                    minor: mi,
                                    value: data[g][ma][mi]
                                }

                                addObservables(newMinor.value);

                                newMajor.values.push(newMinor);
                            }
                        }
                    }
                }
            }
        }
        
        //to.beaconid = makebeaconid(to);
        

    });
}

ko.applyBindings(new AdminViewModel());

window.beacon = function (uuid, major, minor, device_id, proximity) {

    beacon_id = beacon_id.toLowerCase();
    
    if (beacon_id == "00000000-0000-0000-0000-000000000000" || beacon_id == "(null)") {
        beacon_id = null;
    }

    proximity = parseInt(proximity, 10);

    if (window.beacon_func) {
        window.beacon_func(uuid, major, minor, device_id, proximity);
    }

};

window.didEnterForeground = function () {
    if (window.didEnterForeground_func) {
        window.didEnterForeground_func();
    }
}

B = (function () {
    return {
        name: null,
        getName: function () {
            jQuery.ajax({
                type: "GET",
                url: "/client/my/name",
                dataType: "json",
                complete: function (data) {
                    if (data) {
                        B.name = data;
                    } else {
                        var name = prompt("What is your name?");

                        if (name) {
                            B.name = name;

                            jQuery.ajax({
                                type: "PUT",
                                url: "/client/my/name",
                                data: { name: name }
                            });
                        }
                    }
                }
            });
        }

    };

})();
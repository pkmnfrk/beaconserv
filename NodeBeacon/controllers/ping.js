/* jshint node:true */
"use strict";

var url = require("url"),
    database = require("../database"),
    realtime_map = require("../realtime_map");

module.exports = {
    post: function (request, response) {
        var path = url.parse(request.url).pathname.split('/');

        var uuid, major, minor;

        //remove "" and "ping", respectively

        path.shift();
        path.shift();

        if(path.length != 3) {
            response.writeHead("404 Not Found");
            response.end();
            return;
        }

        uuid = path[0];
        major = parseInt(path[1], 10);
        minor = parseInt(path[2], 10);

        database.findClient(request.clientid, function (err, client) {

            database.findBeacon(uuid, major, minor, function(err, docs) {
                if(docs.length === 0) return;

                console.log("Found beacon");


                var beacon = docs[0];

                var ping = {
                    date: new Date(),
                    beacon_id: beacon._id
                };

                //console.log(client);

                client.pings.unshift(ping);

                database.storeClient(client, function() {

                    realtime_map.notifyPing(client, beacon);

                    response.writeJson(beacon);
                });
                
            });
        });
    },
    
    "delete": function(request, response) {
        var path = url.parse(request.url).pathname.split('/');
        path.shift();
        path.shift();

        
        database.findClient(request.clientid, function (err, client) {
            
            var ping = {
                date: new Date(),
                beacon_id: null
            };

            //console.log(client);

            client.pings.unshift(ping);

            database.storeClient(client, function() {

                realtime_map.notifyPing(client, null);

                response.writeHead(204, "No Content");
                response.end();
            });
        });
    }
};
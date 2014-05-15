/* jshint node:true */

"use strict";

var url = require("url"),
    database = require("../database"),
    realtime_map = require("../realtime_map");

module.exports = {
    get: function(request, response) {
    
        var path = url.parse(request.url).pathname;

        if(path[path.length - 1] == "/") {
            path = path.substring(0, path.length - 1);
        }

        path = path.split('/');

        var uuid, major, minor;

        //remove "" and "beacon", respectively

        path.shift();
        path.shift();

        var flatMode = false;

        if(path.length && path[0] == "flat") {
            flatMode = true;
            path.shift();
        }

        if (path.length >= 1) {
            uuid = path[0];
            if(path.length >= 2) {
                major = parseInt(path[1], 10);
                if(path.length >= 3) {
                    minor = parseInt(path[2], 10);
                }
            }
        }



        console.log(uuid + " " + major + " " + minor);

        database.findBeacon(uuid, major, minor, function(err, docs) {

            if(err) {
                response.writeHead("500 Internal Server Error");
                response.write(JSON.stringify(err));
                response.end();
                return;
            }

            if(!flatMode) {
                var ret = {};

                for(var i = 0; i < docs.length; i++) {
                    var b = docs[i];

                    //if(!b.uuid) 
                    //    b.uuid = "00000000-0000-0000-0000-000000000000";

                    if(!(b.uuid in ret)) {
                        ret[b.uuid] = {};
                    }

                    if(!(b.major in ret[b.uuid])) {
                        ret[b.uuid][b.major] = {};
                    }

                    ret[b.uuid][b.major][b.minor] = b;
                }

                docs = ret;
            }

            if(uuid !== undefined) {
                //explicit uuid, unwrap it
                docs = docs[uuid];
            }

            if(major !== undefined) {
                docs = docs[major];
            }

            response.writeJson(docs);

        });
    },
    
    post: function (req, res) {
        var data = "";
        
        req.on("data", function (d) {
            data += d;
        }).on("end", function() {
            
            data = JSON.parse(data);
            
            database.storeBeacon(data, function(saved) {
                realtime_map.notifyBeaconChange(saved);
                res.writeJson(saved);
            });
        });
    }
};
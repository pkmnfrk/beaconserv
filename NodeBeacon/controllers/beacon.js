/* jshint node:true */

"use strict";

var url = require("url"),
    database = require("../database"),
    realtime_map = require("../realtime_map"),
    multiparty = require("multiparty"),
    fs = require("fs"),
    debug = new (require("../debug"))("LOG");

function polyFillBeacon(b) {
    
    if(!b._id)
        b._id = null;
    
    if(!b.uuid) 
        b.uuid = "00000000-0000-0000-0000-000000000000";

    if(!b.major)
        b.major = 0;

    if(!b.minor)
        b.minor = 0;

    if(!b.title)
        b.title = "";

    if(!b.bodyText)
        b.bodyText = "";

    if(!b.url)
        b.url = null;

    if(!b.image)
        b.image = null;
    if(!b.video)
        b.video = null;

    if(!b.maxProximity)
        b.maxProximity = 0;

    if(!b.latitude)
        b.latitude = null;
    if(!b.longitude)
        b.longitude = null;
    
    if(!b.minZoom)
        b.minZoom = 15;
}

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
        
        if(path[0] == "id") {
            
            var id = path[1];
            
            database.findBeaconById(id, function(beacon) {
                debug.info(beacon);
                
                if(!beacon) {
                    beacon = {};
                }
                debug.info(beacon);
                
                polyFillBeacon(beacon);
                
                response.writeJson(beacon);
                return;
            });
            
            return;
            
        } else {
        
            if(path.length && path[0] == "flat") {
                flatMode = true;
                path.shift();
            }

            if (path.length >= 1) {
                uuid = path[0].toLowerCase();
                if(path.length >= 2) {
                    major = parseInt(path[1], 10);
                    if(path.length >= 3) {
                        minor = parseInt(path[2], 10);
                    }
                }
            }



            //debug.info(uuid + " " + major + " " + minor);

            database.findBeacon(uuid, major, minor, function(err, docs) {
                var i, b;
                if(err) {
                    response.writeError(err);
                    return;
                }

                for(i = 0; i < docs.length; i++) {
                    b = docs[i];

                    polyFillBeacon(b);

                }

                if(!flatMode) {
                    var ret = {};

                    for(i = 0; i < docs.length; i++) {
                        b = docs[i];



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


                if(!flatMode) {
                    if(uuid !== undefined) {
                        //explicit uuid, unwrap it
                        docs = docs[uuid];
                    }

                    if(!docs) {
                        docs = {};
                    }

                    if(major !== undefined) {
                        docs = docs[major];
                    }

                    if(!docs) {
                        docs = {};
                    }
                }

                response.writeJson(docs);

            });
        }
    },
    
    post: function (req, res) {
        var data = "";
        var urlparts = url.parse(req.url, true);
        
        var parts = urlparts.pathname.split("/").slice(2);
        
        if(parts.length && parts[0]) {
            
            var form = new multiparty.Form();
            
            form.parse(req, function(err, fields, files) {
                var file;
                
                var path = "/Content";
                var uuid = urlparts.query.uuid;
                var major = urlparts.query.major;
                var minor = urlparts.query.minor;
                
                if(parts[0] === "image") {
                    file = files.image[0];
                    path += "/photos/";
                    
                } else if(parts[0] === "video") {
                
                    file = files.video[0];
                    path += "/videos/";
                }
                
                if(!file) {
                    res.writeHeader(400, "Bad Request");
                    res.end();
                    return;
                }
                
                if(!fs.existsSync("./static" + path)) {
                    fs.mkdirSync("./static/" + path);
                }
                
                path += uuid + "." + major + "." + minor;
                
                path += file.originalFilename.substring(file.originalFilename.lastIndexOf("."));
                
                fs.rename(file.path, "./static/" + path, function(err) {
                    if(err) {
                        res.writeError(err);
                        return;
                    }
                    var ret = {
                        path: path
                    };

                    res.writeJson(ret);
                });
                
            });
            
            return;
        }
        
        req.on("data", function (d) {
            data += d;
        }).on("end", function() {
            debug.log("Posting Beacon", data);
            
            data = JSON.parse(data);
            if(!data) {
                debug.warn("Passed JSON data is invalid", data);
                
            }
            database.storeBeacon(data, function(err, saved) {
                if(err) {
                    res.writeError(err);
                    return;
                }
                if(!saved) {
                    debug.error("What the hell, how could we get here??", err);
                }
                realtime_map.notifyBeaconChange(saved);
                res.writeJson(saved);
            });
        });
    }
};
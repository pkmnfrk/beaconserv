/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map"),
    url = require("url"),
    database = require("../database"),
    fs = require("fs"),
    mkdirp = require("mkdirp");

module.exports = {
    get: function (req, res) {
        var path = url.parse(req.url).pathname.split('/');
        var floor;
        
        path.shift();
        path.shift();
        
        if(!path.length) {
            res.writeHead(404, "Not Found");
            res.end();
            return;
        }
        
        switch(path[0]) {
            case "closeall":
                
                realtime_map.closeAllConnections();
                
                res.writeHead(204, "No Content");
                res.end();
                
                return;
            case "labels":
                floor = null;
                if(path.length > 1) {
                    floor = parseInt(path[1], 10);
                }
                database.getLabels(floor, function(err, labels) {
                    if(err) {
                        res.writeError(err);
                        return;
                    }
                    
                    res.writeJson(labels);
                });
                
                return;
            case "markers":
                floor = null;
                if(path.length > 1) {
                    floor = parseInt(path[1], 10);
                }
                database.getMarkers(floor, function(err, markers) {
                    if(err) {
                        res.writeError(err);
                        return;
                    }
                    
                    res.writeJson(markers);
                    
                });
                return;
            case "marker":
                
                database.getMarker(path[1], function(err, marker) {
                    if(err) {
                        res.writeError(err);
                        return;
                    }
                    
                    res.writeJson(marker, {
                        "Cache-Control": "max-age=60"
                    });
                        
                });
                
                return;
        }
        
        
        res.writeHead(404, "Not Found");
        res.end();
        
    },
    
    post: function(req, res)
    {
        var path = url.parse(req.url).pathname.split('/');
        var data = '';
        
        
        path.shift();
        path.shift();
        
        if(!path.length) {
            res.writeHead(404, "Not Found");
            res.end();
            return;
        }
        
        switch(path[0]) {
            case "label":
                
                req.on('data', function(d) {
                    data += d;
                });
                req.on('end', function() {
                    data = JSON.parse(data);
                    
                    database.storeLabel(data, function(err, obj) {
                        if(err)
                        {
                            res.writeError(err);
                            return;
                        }     
                        
                        if(obj) {
                            res.writeJson(obj);
                            
                        } else {
                            res.writeHead(204, "No Content");
                            res.end();
                        }
                    });
                    
                });
                //req.finish();
                return;
                
            case "marker":
                
                req.on('data', function(d) {
                    data += d;
                });
                req.on('end', function() {

                    var onMarkerLoad = function(marker) {
                        if(!path[2]) {
                            data = JSON.parse(data);

                            database.storeMarker(data, function(err, obj) {
                                if(err)
                                {
                                    res.writeError(err);
                                    return;
                                }    
                                if(obj) {
                                    res.writeJson(obj);

                                } else {
                                    res.writeHead(204, "No Content");
                                    res.end();
                                }
                            });
                        } else if(path[2] == "images") {
                            data = data.split(',')[1];
                            data = new Buffer(data, 'base64');
                            
                            var filename = req.headers["x-filename"];
                            if(!filename) {
                                res.writeError({
                                    message: "Filename is missing",
                                    headers: req.headers
                                });
                                return;
                            }
                            
                            filename = filename.replace(/[/\\*?]/g, '');
                            var type = req.headers["content-type"];
                            
                            var destDir = "./static/Content/markers/" + marker._id;
                            var filePath = destDir + "/" + filename;
                            
                            mkdirp("./static/Content/markers/" + marker._id, function(err) {
                                
                                if(err) {
                                    res.writeError(err);
                                    return;
                                }
                                
                                console.log(data.length);
                                
                                fs.writeFile(filePath, data, { encoding: 'binary', flag: "w" }, function(err) {
                                    if(err) {
                                        res.writeError(err);
                                        return;
                                    }
                                    
                                    if(!marker.images) {
                                        marker.images = [];
                                    }
                                    
                                    for(var i = 0; i < marker.images.length; i++) {
                                        if(marker.images[i] === null) {
                                            marker.images.splice(i, 1);
                                            i--;
                                        } else if(marker.images[i].filename == filename) {
                                            marker.images.splice(i, 1);
                                            i--;
                                        }
                                    }
                                    
                                    marker.images.push({
                                        filename: filename,
                                        filetype: type,
                                        url: "/Content/markers/" + marker._id + "/" + filename
                                    });
                                    
                                    database.storeMarker(marker, function(err, obj) {
                                        if(err) {
                                            res.writeError(err);
                                            return;
                                        }
                                        
                                        if(obj) {
                                            res.writeJson(obj);
                                            return;
                                        } else {
                                            res.writeJson(marker);
                                            return;
                                        }
                                        
                                        
                                    });
                                    
                                });
                                
                                
                                
                            });
                        }
                    };
                    
                    if(path[1]) {
                        database.getMarker(path[1], function(err, marker) {
                            
                            if(err) {
                                res.writeError(err);
                                return;
                            }
                            
                            onMarkerLoad(marker);
                            
                        });
                    } else {
                        onMarkerLoad(null);
                    }

                    
                });
                //req.finish();
                return;
                
        }
        
        
        res.writeHead(404, "Not Found");
        res.end();
        
    },
    
    "delete": function(req, res) {
        var path = url.parse(req.url).pathname.split('/');
        var data = '';
        
        
        path.shift();
        path.shift();
        
        if(!path.length) {
            res.writeHead(404, "Not Found");
            res.end();
            return;
        }
        
        switch(path[0]) {
            case "label":
                
                database.deleteLabel(path[1], function(err, nDel) {
                    if(err) {
                        res.writeError(err);
                    } else if(nDel < 1) {
                        res.WriteHead(404, "Not Found");
                    } else {
                        res.writeHead(204, "No Content");
                        res.end();
                    }
                });
                
                return;
                
            case "marker":
                 
                database.deleteMarker(path[1], function(err, nDel) {
                    if(err) {
                        res.writeError(err);
                    } else if(nDel < 1) {
                        res.WriteHead(404, "Not Found");
                    } else {
                        res.writeHead(204, "No Content");
                        res.end();
                    }
                });
                //req.finish();
                return;
        }
        
        
        res.writeHead(404, "Not Found");
        res.end();
    }
};
/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map"),
    url = require("url"),
    database = require("../database");

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
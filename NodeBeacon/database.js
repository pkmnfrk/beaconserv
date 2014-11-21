/* jshint node: true, undef: true */

var mongo = require('mongodb'),
    client = mongo.MongoClient,
    debug = new (require("./debug"))("LOG"),
    db = null;

function start(onReady) {
    debug.info("Connecting to db...");
    
    client.connect("mongodb://localhost:27017/beacon", {}, function(err, database) {
        if(err) throw err;
        
        debug.info("Connected to db.");
        db = database;
        
        debug.info("Running maintenance:");
        
        db.collection("beacon").ensureIndex({uuid: 1, major: 1, minor: 1}, {background: true}, function(err) {
            
        });
        
        if(onReady) onReady();
    });
}

function findBeacon (uuid, major, minor, onComplete) {
    var beacons = db.collection('beacon');
    
    if(typeof uuid === "function") {
        onComplete = uuid;
        uuid = undefined;
    } else if(typeof major === "function") {
        onComplete = major;
        major = undefined;
    } else if(typeof minor === "function") {
        onComplete = minor;
        minor = undefined;
    }
    
    var query = {};
    
    if(typeof uuid !== "undefined") query.uuid = uuid.toString().toLowerCase();
    if(typeof major !== "undefined") query.major = major;
    if(typeof minor !== "undefined") query.minor = minor;
        
    
    var results = beacons
                    .find(query)
                    .sort({uuid: 1, major: 1, minor: 1})
                    .toArray(onComplete);
}

function storeBeacon(beacon, onComplete) {
    var beacons = db.collection('beacon');
    
    if(typeof beacon._id === "string") {
        beacon._id = new mongo.ObjectID(beacon._id);   
    }
    
    if(beacon.uuid) beacon.uuid = beacon.uuid.toLowerCase();
    
    debug.log(beacon);
    
    var query = { uuid: beacon.uuid, major: beacon.major, minor: beacon.minor};
    
    beacons.update(query, beacon, { upsert:true }, function(err, doc) {
        if(err) onComplete(err);
        
        debug.log(doc);
        
        
        
        beacons.findOne(query, function(err, obj) {
            if(err) onComplete(err);
            
            debug.log(obj);
            
            onComplete(null, obj);
        });
    });
}

function storeObject(collection, object, callback) {
    if(object._id) {
        
        object._id = typeof(object._id) === "object" ? object._id : new mongo.ObjectID(object._id);
    
        var query = {_id: object._id};
        collection.update(query, object, { upsert:true }, function(err) {
            callback(err);
        });
    } else{
        collection.save(object, function(err, obj) {
            if(!err) {
                debug.log(obj);
            }
            callback(err, obj);
        });
    }
}


exports.start = start;
exports.findBeacon = findBeacon;
exports.storeBeacon = storeBeacon;
exports.findClient = function(clientid, callback) {
    debug.debug("Top of database.findClient");
    var clients = db.collection("client");
    
    
    clients.findOne({ clientid: clientid }, function(err, obj) {
        debug.debug("Top of findClient result");
        if(err) {
            debug.debug("Returning error", err);
            callback(err, null);
        }
        
        if(!obj) {
            debug.debug("Client doesn't exist, creating new one");
            obj = {
                clientid: clientid,
                name: null,
                pings: []
            };
            clients.save(obj, function(err) {
                debug.info("Saving new client");
                callback(null, obj);
            });
        } else {
            setTimeout(function() {
                debug.info("Returning old client");
                callback(null, obj); 
            }, 0);
        }
    });
};

exports.storeClient = function(client, callback) {
    var clients = db.collection("client");
    
    clients.save(client, function(err) { 
        if(err) {
            callback(err);   
        }
        if(callback) callback(null);
    });
};

exports.findClients = function(query, callback) {
    debug.debug("Top of database.findClients");
    var clients = db.collection("client");
    
    if(typeof query == "function") {
        debug.debug("Munging arguments");
        callback = query;   
        query = undefined;
    }
    
    clients.find(query).toArray(function(err, objs) {
        debug.debug("Top of database.findClients.results");
        if(err){
            debug.debug("Got error from collection, returning error", err);
            callback(err, null);
            return;
        }
        
        var now = new Date();
        var toSave = [];
        
        for(var i = 0; i < objs.length; i++) {
            debug.debug("Proessing client #", i);
            var c = objs[i];
            if(c.pings.length) {
                debug.debug("Client has pings");
                for(var j = 0; j < c.pings.length; j++) {
                    if((now - Date.parse(c.pings[j].date)) > (1000 * 60 * 60 * 24)) {
                        debug.debug("Trimming old pings, up to", j);
                        c.pings = c.pings.slice(0, j);
                        toSave.push(c);
                        break;
                    }
                }
            }
        }
        
        debug.debug("Done processing clients");
        
        
        (function saveFunc() {
            debug.debug("Top of database.findClients.saveFunc()");
            if(!toSave.length) {
                debug.debug("Done saving clients, invoking callback");
                callback(null, objs);
            }
            else {
                debug.debug("Saving a client");
                exports.storeClient(toSave.pop(), saveFunc);
            }
        })();
    });
};

exports.findBeaconById = function(id, callback) {
    var beacons = db.collection("beacon");
    var oid = new mongo.ObjectID(id);
    
    var query = {_id : oid};
    
    beacons.findOne(query, function(err, obj) {
        if(err) throw err;
        
        callback(obj);
    });
};

exports.getLabels = function(floor, callback) {
    var labels = db.collection("label");
    var query = {};
    
    if(floor) {
        query.floor = floor;
    }
    
    labels.find(query).toArray(callback);
};


exports.storeLabel = function(label, callback)
{
    storeObject(db.collection("label"), label, callback);
};

exports.deleteLabel = function(id, callback)
{
    if(typeof id !== "object") {
        id = new mongo.ObjectID(id);
    }
    
    var labels = db.collection("label");
    labels.remove({_id: id}, callback);
};

exports.getMarkers = function(floor, callback)
{
    var query = {};
    if(floor) query.floor = floor;
    
    var markers = db.collection("marker");
    markers.find(query).toArray(callback);
};

exports.getMarker = function(markerId, callback)
{
    var query = {};
    
    if(typeof markerId !== "object") {
        markerId = new mongo.ObjectID(markerId);
    }
    
    query._id = markerId;
    
    var markers = db.collection("marker");
    markers.findOne(query, callback);
};


exports.storeMarker = function(marker, callback)
{
    storeObject(db.collection("marker"), marker, callback);
};

exports.deleteMarker = function(id, callback)
{
    if(typeof id !== "object") {
        id = new mongo.ObjectID(id);
    }
    debug.info("About to delete a marker");
    
    var markers = db.collection("marker");
    markers.remove({_id: id}, callback);
};

var fullscreenConfig = {
    left: {
        name: "Blank",
        url: "about:blank"
    },
    right: {
        name: "Blank",
        url: "about:blank"
    }
};


exports.getFullscreenConfig = function(callback) {
    var fsconfig = db.collection("fsconfig");
    fsconfig.findOne({}, function(err, obj) {
        if(!obj) {
            obj = fullscreenConfig;
        }
            
        callback(err, obj);
        
    });
};

exports.putFullscreenConfig = function(data, callback) {
    
    //fullscreenConfig = data;
    
    var fsconfig = db.collection("fsconfig");
    fsconfig.save(data, callback);
    
    //setTimeout(callback, 0);
    
};

exports.getDownloads = function(callback) {
    var downloads = db.collection("downloads");
    
    downloads.find({}).toArray(callback);
};

exports.saveDownload = function(dl, callback) {
    var downloads = db.collection("downloads");
    
    storeObject(downloads, dl, callback);
};

exports.deleteDownload = function(dl, callback) {
    var downloads = db.collection("downloads");
    
    if(!dl._id) callback(false);
    
    if(typeof dl._id != "object")
        dl._id = new mongo.ObjectID(dl._id);
    
    downloads.delete({_id: dl._id}, callback);
};
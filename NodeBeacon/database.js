/* jshint node: true, undef: true */

var mongo = require('mongodb'),
    client = mongo.MongoClient,
    db = null;

function start(onReady) {
    console.log("Connecting to db...");
    
    client.connect("mongodb://localhost:27017/beacon", {}, function(err, database) {
        if(err) throw err;
        
        console.log("Connected to db.");
        db = database;
        
        console.log("Running maintenance:");
        
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
    
    console.log(beacon);
    
    var query = { uuid: beacon.uuid, major: beacon.major, minor: beacon.minor};
    
    beacons.update(query, beacon, { upsert:true }, function(err, doc) {
        if(err) onComplete(err);
        
        console.log(doc);
        
        
        
        beacons.findOne(query, function(err, obj) {
            if(err) onComplete(err);
            
            console.log(obj);
            
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
                console.log(obj);
            }
            callback(err, obj);
        });
    }
}


exports.start = start;
exports.findBeacon = findBeacon;
exports.storeBeacon = storeBeacon;
exports.findClient = function(clientid, callback) {
    var clients = db.collection("client");
    
    clients.findOne({ clientid: clientid }, function(err, obj) {
        if(err) throw err;
        
        if(!obj) {
            obj = {
                clientid: clientid,
                name: null,
                pings: []
            };
            clients.save(obj, function(err) {
                console.log("Saving new client");
                callback(obj);
            });
        } else {
            setTimeout(function() {
                console.log("Returning old client");
                callback(obj); 
            }, 0);
        }
    });
};

exports.storeClient = function(client, callback) {
    var clients = db.collection("client");
    
    clients.save(client, function(err) { 
        if(err) throw err; 
        if(callback) callback();
    });
};

exports.findClients = function(query, callback) {
    var clients = db.collection("client");
    
    if(typeof query == "function") {
        callback = query;   
        query = undefined;
    }
    
    clients.find(query).toArray(function(err, objs) {
        if(err) throw err;
        var now = new Date();
        var toSave = [];
        
        for(var i = 0; i < objs.length; i++) {
            
            var c = objs[i];
            if(c.pings.length) {
                for(var j = 0; j < c.pings.length; j++) {
                    if((now - Date.parse(c.pings[j].date)) > (1000 * 60 * 60 * 24)) {
                        c.pings = c.pings.slice(0, j);
                        toSave.push(c);
                        break;
                    }
                }
            }
        }
        
        (function saveFunc() {
            if(!toSave.length) callback(objs);
            else exports.storeClient(toSave.pop(), saveFunc);
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
    console.log("About to delete a marker");
    
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
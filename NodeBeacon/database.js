
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
        if(err) throw err;
        
        console.log(doc);
        
        
        
        beacons.findOne(query, function(err, obj) {
            if(err) throw err;
            
            console.log(obj);
            
            onComplete(obj);
        });
    });
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
    setTimeout(function() {
        callback(fullscreenConfig);
    }, 0);
};

exports.putFullscreenConfig = function(data, callback) {
    
    fullscreenConfig = data;
    
    setTimeout(callback, 0);
    
};
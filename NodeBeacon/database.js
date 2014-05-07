
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
        
        if(onReady) onReady()
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
    
    if(typeof uuid !== "undefined") query["uuid"] = uuid;
    if(typeof major !== "undefined") query["major"] = major;
    if(typeof minor !== "undefined") query["minor"] = minor;
        
    
    var results = beacons
                    .find(query)
                    .sort(["uuid", "major", "minor"])
                    .toArray(onComplete);
}

function storeBeacon(beacon) {
    var beacons = db.collection('beacon');
    
    beacons.save(beacon);
}

function storePing(ping) {
    var beacons = db.collection('beacon');
    
    beacons.save(ping);
}

exports.start = start;
exports.findBeacon = findBeacon;
exports.storeBeacon = storeBeacon;
exports.storePing = storePing;

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
                name: "Unnamed",
                pings: []
            };
            clients.save(obj, function(err) {
                callback(obj);
            });
        } else {
            callback(obj); 
        }
    });
};

exports.storeClient = function(client) {
    var clients = db.collection("client");
    
    clients.save(client, function(err) { if(err) throw err; });
};

exports.findClients = function(query, callback) {
    var clients = db.collection("client");
    
    if(typeof query == "function") {
        callback = query;   
        query = undefined;
    }
    
    clients.find(query).toArray(function(err, objs) {
        if(err) throw err;
        
        callback(objs);
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
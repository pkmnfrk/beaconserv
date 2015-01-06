/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map");
var url = require("url"),
    fs = require("fs"),
    qs = require("querystring"),
    feed = require("feed-read"),
    http = require("http"),
    database = require("../database"),
    Generator = require("../generator");

var lastRedditFetch = {};
var lastReddit = {};

var lastChatterFetch = null;
var lastChatter = null;

var feeds = {
    reddit: {
        name: "Reddit /r/technology",
        url: "http://www.reddit.com/r/technology/.rss"
    },
    ars: {
        name: "Ars Technica",
        url: "http://feeds.arstechnica.com/arstechnica/technology-lab"
    },
    wired: {
        name: "Wired",
        url: "http://feeds.wired.com/wired/index"
    },
    techcrunch: {
        name: "TechCrunch (Gadgets/Gear)",
        url: "http://feeds.feedburner.com/crunchgear"
    },
    engadget: {
        name: "Engadget",
        url: "http://www.engadget.com/rss.xml"
    },
    
    "labsprojects": {
        name: "Upcoming Labs Projects",
        url: "http://ibeacon.klick.com/utild/projectgenrss/5"
    }
};

var projectGenerator = new Generator();

projectGenerator.templates = [
    "{modifier?}{product}{enabled?} {projectType}{suffixModifier?}",
    
];

projectGenerator.wordLists = {
    enabled: [
        "-enabled"
    ],
    modifier: [
        "Wearable ",
        "Responsive ",
        "Smart ",
        "Connected ",
        "Gamified ",
        "Service-oriented ",
        "Rich ",
        "Programmatic ",
        "Disruptive "
    ],
    product: [
        "Oculus Rift",
        "Apple Watch",
        "Leap Motion",
        "Kinect",
        "iPhone",
        ".NET",
        "Javascript/HTML",
        "WebGL"
    ],
    
    technology: [
        " .NET ",
        " Javascript/HTML ",
        " Ruby on Rails ",
        " Node.js ",
        " Objective-C ",
        " PHP "
        
    ],
    
    projectType: [
        "mobile app",
        "website",
        "VR experience",
        "interactive visual aid",
        //"PDUFA site",
        "method of action"
    ],
    
    diseaseAdj: [
        "diabetic",
        "chronic pain",
        "oncology"
    ],
    
    audience: [
        "patients",
        "reps"
    ],
        
    suffixModifier: [
        " aimed at {diseaseAdj} {audience}",
        "-in-a-box",
        " in the cloud",
        " with social hooks",
        " written in {technology}"
    ]
};


module.exports = {
    post: function (request, response) {
        
        var path = url.parse(request.url).pathname.split('/');
        var body = "";
        
        path.shift();
        path.shift();
        
        if(path[0] == "football") {
            
            request.on("data", function(d) {
                body += d;
                if(body.length > 1e6) {
                    request.connection.destroy();
                }
            });
            request.on("end", function(){ 
                var data = qs.parse(body);

                
                fs.readFile("static/util/football.json", function(error, json) {
                    console.log(json);
                    
                    json = JSON.parse(json);
                    console.log(json);
                    
                    for(var key in data) {
                        if(data.hasOwnProperty(key)) {
                            json[key] = data[key];
                        }
                    }
                    
                    json = JSON.stringify(json);
                    
                    fs.writeFile("static/util/football.json", json, function() {
                        response.writeHead(301, "Moved Permanently", { "Location": "/util/footballAdmin.html" });
                        response.end();
                        
                    });
                });
                


            });
            
            
            return;
            
        } else if(path[0] == "downloads") {
            request.on("data", function(d) {
                body += d;
                if(body.length > 1e6) {
                    request.connection.destroy();
                }
            });
            request.on("end", function() {
                var data = JSON.parse(body);
                
                if(!data.url) {
                    response.writeError({
                        error: true,
                        message: "No URL"
                    });   
                }
                if(!data.progress) data.progress = 0;
                if(!data.error) data.error = false;
                
                database.saveDownload(data, function(obj, err) {
                    if(err) {
                        response.writeError(err);
                        return;
                    }
                    
                    response.writeJson(obj);
                });
            });
        }
    },
    
    get: function (request, response) {
        
        var path = url.parse(request.url).pathname.split('/');
        var body = "";
        
        path.shift();
        path.shift();
        
        if(path[0] == "technews") {
            
            var feedName = path[1] || 'reddit';
            
            (function() {
                /*
                if(lastRedditFetch[feedName] && lastRedditFetch[feedName] >= new Date(new Date().getTime() + -15*60000)) {
                    
                    response.writeJson(lastReddit[feedName]);
                    return;
                }
                */
                
                
                
                var rssUrls = feedName.split(',');
                
                for(var i = 0; i < rssUrls.length; i++) {
                    if(!feeds[rssUrls[i]]) {
                        response.writeHead(404, "Not Found");
                        response.end();
                        return;
                    }
                    
                    rssUrls[i] = feeds[rssUrls[i]];
                }
                
                var item = [];
                
                var handleFeed = function(err, articles) {
                    
                    if(err) {
                        /*
                        item.push({
                            title: "Error fetching feed",
                            date: new Date().toLocaleDateString(),
                            error: err
                        });
                        */
                        
                        
                    } else {
                        for(var i = 0; i < Math.min(6, articles.length); i++) {
                            item.push({
                                title: articles[i].title,
                                date: articles[i].published.getTime(),
                                source: rssUrls[0].name,
                                body: articles[i].content
                            });
                        }
                    }

                    rssUrls.shift();

                    if(!rssUrls.length) {
                        
                        item.sort(function(a,b) {
                            return b.date - a.date;
                        });
                        
                        response.writeJson(item);
                        return;
                    }
                    
                    feed(rssUrls[0].url, handleFeed);
                };
                
                feed(rssUrls[0].url, handleFeed);
            })();
            
        } else if (path[0] == "chatter") {
            
            //http://genome.klick.com/api/Chatter?PageSize=5
            
            (function() {
                
                if(lastChatterFetch && lastChatterFetch >= new Date(new Date().getTime() + -15*60000)) {
                    
                    response.writeJson(lastChatter);
                    return;
                }
                
                var n = 10;
                
                var rssUrl = "http://genome.klick.com/api/Chatter?PageSize=" + n;
                
                
                
                var req = http.request({
                    hostname: "genome.klick.com",
                    path: "/api/Chatter?PageSize=" + n,
                    headers: {
                        "Cookie": "SessionState.SessionID=5614bc3f-42e0-4290-bca6-e260c6258ca9; SmartSiteVisitorID=19727f2085db4ee4b20bc94c342cae56",
                        "Accept": "application/json"
                    }
                    
                }, function(res) {
                    res.on("data", function(d) {
                        data += d;
                        //console.log("Content");
                    });
                    res.on("end", function() {
                        //console.log("end content!");
                        data = JSON.parse(data);
                        var ret = [];

                        for(var i = 0; i < data.Entries.length; i++) {
                            var entry = data.Entries[i];
                            if(entry.IsKudos) continue; //not that I don't want to show kudos, but they need more work so let's omit them for now
                            var d = {
                                id: entry.ChatterID,
                                title: entry.MassagedContent,
                                date: new Date().toLocaleDateString(),
                                name: entry.CreatedByFirstNameAndInitial,
                                photo: url.resolve('http://genome.klick.com', entry.CreatedByPhotoPath),
                                isCatter: entry.ChatterID === 26059
                            };
                            
                            if(entry.Attachments.length) {
                                d.attachments = [];
                                for(var a = 0; a < entry.Attachments.length; a++) {
                                    d.attachments.push({
                                        url: url.resolve('http://genome.klick.com', entry.Attachments[a].Link),
                                        type: entry.Attachments[a].ContentType,
                                        width: entry.Attachments[a].Width,
                                        height: entry.Attachments[a].Height
                                    });
                                }
                            } 
                            //else {
                            //    continue;
                            //}
                            
                            ret.push(d);
                        }

                        lastChatter = ret;
                        lastChatterFetch = new Date();
                        
                        response.writeJson(ret);

                    });
                });
                var data = "";
                
                
                
                req.on("error", function() {
                    response.writeJson({error: true}); 
                });
                
                req.end();
            })();
            
        } else if(path[0] == "downloads") {
            (function() {
                console.log("Downloads!");
                database.getDownloads(function(dls, err) {
                    if(err) {
                        response.writeJson(err);
                        return;
                    }
                    
                    response.writeJson(dls);
                });
            })();
        } else if(path[0] == "projectgen") {
            (function() {
                
                var n = 1;
                
                if(path[1]) n = parseInt(path[1], 10) || 1;
                
                var ret = [];
                
                for(var i = 0; i < n; i++) {
                    ret.push(projectGenerator.generate());
                }
                
                response.writeJson(ret);
            })();
        } else if(path[0] == "projectgenrss") {
            (function() {
                
                var n = 1;
                
                if(path[1]) n = parseInt(path[1], 10) || 1;
                
                var resp = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
                resp += "<rss version=\"2.0\">";
                resp += "<channel>";
                resp += "<title>Lab Projects</title>";
                resp += "<link>http://ibeacon.klick.com/</link>";
                resp += "<description />";
                for(var i = 0; i < n; i++) {
                    var title = projectGenerator.generate();
                    resp += "<item>";
                    resp += "<title>" + title + "</title>";
                    resp += "<pubDate>";
                    var today = new Date();
                    today.setHours(today.getHours() + i);
                    resp += today.toUTCString();
                    resp += "</pubDate>";
                    resp += "</item>";
                }
                resp += "</channel>";
                resp += "</rss>";
                
                response.writeHead(200, { "Content-Type": "text/xml" });
                response.write(resp);
                response.end();
            })();
        }
    }
};
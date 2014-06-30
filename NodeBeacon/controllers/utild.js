/* jshint node:true */
"use strict";

var realtime_map = require("../realtime_map");
var url = require("url"),
    fs = require("fs"),
    qs = require("querystring"),
    feed = require("feed-read"),
    http = require("http");

var lastRedditFetch = {};
var lastReddit = {};

var lastChatterFetch = null;
var lastChatter = null;


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
                
                if(lastRedditFetch[feedName] && lastRedditFetch[feedName] >= new Date(new Date().getTime() + -15*60000)) {
                    
                    response.writeJson(lastReddit[feedName]);
                    return;
                }
                
                var rssUrl;
                
                if(feedName == "reddit") {
                    rssUrl = "http://www.reddit.com/r/technology/.rss";
                } else if(feedName == "ars") {
                    rssUrl = "http://feeds.arstechnica.com/arstechnica/technology-lab";
                } else {
                    response.writeHead(404, "Not Found");
                    response.end();
                    return;
                    
                }
                
                feed(rssUrl, function(err, articles) {
                    var item = [];
                    
                    if(err) {
                        item.push({
                            title: "Error fetching feed",
                            date: new Date().toLocaleDateString()
                        });
                    } else {
                        for(var i = 0; i < Math.min(6, articles.length); i++) {
                            item.push({
                                title: articles[i].title,
                                date: articles[i].published.toLocaleDateString()
                            });
                        }
                    }
                    
                    lastReddit[feedName] = item;
                    lastRedditFetch[feedName] = new Date();
                    
                    response.writeJson(item);
                    
                });
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
                        "Cookie": "SessionState.SessionID=2dcc7e3f-b5ef-44e6-8a30-ded6d274e545; ss-id=UGNjos6hwFLQAXT1VM0/; ss-pid=i0zV6AZkIK3zFXHngnMu; SmartSiteVisitorID=b20b06fb34014f5f8928d9018b64b5d7",
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
                            var d = {
                                title: entry.MassagedContent,
                                date: new Date().toLocaleDateString(),
                                name: entry.CreatedByFirstNameAndInitial,
                                photo: url.resolve('http://genome.klick.com', entry.CreatedByPhotoPath)
                            };
                            
                            if(entry.Attachments.length) {
                                d.attachments = [];
                                for(var a = 0; a < entry.Attachments.length; a++) {
                                    d.attachments.push({
                                        url: url.resolve('http://genome.klick.com', entry.Attachments[a].Link)
                                    });
                                }
                            }
                            
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
            
        }
    }
};
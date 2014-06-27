function getQuerystring() {
    var qs2 = {}, querystring = window.location.search.substring(1);
                
    querystring = querystring.split('&');
    for(var i = 0; i < querystring.length;i++) {
        var itm = querystring[i].split('=');

        qs2[decodeURIComponent(itm[0])] = decodeURIComponent(itm[1]);
    }
    
    return qs2;
}

function parseTime(t) {
    
    var time = t.match(/(\d+)(?::(\d\d))?\s*(p?)/);
    if(!time) return new Date();
    var d = new Date();
    var h = parseInt(time[1], 10) + (time[3] ? 12 : 0);
    var m = parseInt(time[2], 10) || 0;
    
    if(h == 24) h = 12;
    
    d.setHours( h );
    d.setMinutes( m );
    
    return d;
}
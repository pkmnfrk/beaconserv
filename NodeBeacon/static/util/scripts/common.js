function getQuerystring() {
    var qs2 = {}, querystring = window.location.search.substring(1);
                
    querystring = querystring.split('&');
    for(var i = 0; i < querystring.length;i++) {
        var itm = querystring[i].split('=');

        qs2[decodeURIComponent(itm[0])] = decodeURIComponent(itm[1]);
    }
    
    return qs2;
}
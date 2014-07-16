/* jshint browser:true, undef: true, unused: true */
/* global L, Display */

Display.Marker = function(data) {
    for(var i in data) {
        if(data.hasOwnProperty(i)) {
            this[i] = data[i];
        }
    }
    
    this._marker = L.Marker();
    this._marker.Marker = this;
};

Display.Marker.prototype = {
    
};
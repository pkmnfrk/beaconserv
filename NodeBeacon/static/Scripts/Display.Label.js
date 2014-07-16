/* jshint browser:true, undef: true, unused: true */
/* global B, Display */

Display.Label = function(data) {
    for(var i in data) {
        if(data.hasOwnProperty(i)) {
            this[i] = data[i];
        }
    }
    
    this._label = new B.SimpleLabel();
    this._label.Label = this;
};

Display.Label.prototype = {
    
};
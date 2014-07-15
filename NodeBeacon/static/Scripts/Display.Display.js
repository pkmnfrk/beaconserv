function Display() {
    this.zoomOffset = 15;
    this.scalar = 0x4c10;
    this._in_device = location.search === "?ios";
    this._in_tv = location.search === "?tv";
    this.labels = [];
    this.beacons = [];
    
    $("#debugArea").remove();

    var updateStatusBar = navigator.userAgent.match(/iphone|ipad|ipod/i) &&
            parseInt(navigator.appVersion.match(/OS (\d)/)[1], 10) >= 7;

    if (updateStatusBar) {
        document.body.style.marginTop = '20px';
    }
}


Display.prototype = {
    inDevice: function() {
        return this._in_device;
    },
    
    inTv: function() {
        return this._in_tv;
    },
    
    editable: function() {
        return !this.inTv() && !this.inDevice();
    },
    
    shouldShowLabels: function() {
        return true;
    },
    
};
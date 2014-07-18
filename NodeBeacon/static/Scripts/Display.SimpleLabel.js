/* jshint browser:true, undef: true, unused: true */
/* global $, L, B */

B.SimpleLabel = L.Class.extend({
    options: {
        minZoom: 0,
        maxZoom: 1000,
        text: "My Label",
        fontSize: "18px",
        backgroundColor: "rgba(0,0,0,0.5)",
        color: "white"

    },
    includes: [
        L.Mixin.Events  
    ],
    initialize: function (latlng, options) {
        // save position of the layer or any options from the constructor
        this._latlng = latlng;

        L.Util.setOptions(this, options);
        this._manuallyHidden = false;

        var testElement = document.getElementById("Test");
        if(!testElement) {
            testElement = L.DomUtil.create('div', '');
            testElement.id = "Test";
            document.body.appendChild(testElement);
        }

    },

    onAdd: function (map) {
        this._map = map;

        // create a DOM element and put it into one of the map panes
        this._el = L.DomUtil.create('div', 'simple-label-layer leaflet-zoom-hide');

        $(this._el).text(this.options.text).css({
            fontSize: this.options.fontSize,
            backgroundColor: this.options.backgroundColor,
            color: this.options.color
        });

        var testElement = document.getElementById("Test");
        testElement.style.fontSize = this.options.fontSize;
        $(testElement).text(this.options.text);
        var width = (testElement.clientWidth + 6);
        var height = (testElement.clientHeight + 0);

        $(this._el).css({
            width: width + "px",
            marginLeft: -(width / 2) + "px",
            //height: height + "px",
            marginTop: -(height / 2) + "px"
        });

        //$(this._el).on('click', this._click, this);

        map.getPanes().overlayPane.appendChild(this._el);

        // add a viewreset event listener for updating layer's position, do the latter
        map.on('viewreset', this._reset, this);

        this._draggable = new L.Draggable(this._el);
        this._draggable.enable();
        this._draggable.on("drag", this._drag, this);
        this._draggable.on("dragend", this._dragend, this);

        this._reset();
    },

    onRemove: function (map) {
        // remove layer's DOM elements and listeners
        map.getPanes().overlayPane.removeChild(this._el);
        map.off('viewreset', this._reset, this);
    },

    _reset: function () {
        if(this._manuallyHidden) {
            return;
        }
        var zoom = this._map.getZoom();
        if(zoom < this.options.minZoom || zoom > this.options.maxZoom) {
            $(this._el).hide();
        } else {
            $(this._el).show();
        }
        // update layer's position
        var pos = this._map.latLngToLayerPoint(this._latlng);
        L.DomUtil.setPosition(this._el, pos);
    },

    getLatLng: function() {
        return this._latlng;
    },
    setLatLng: function(latlng) {
        this._latlng = latlng;
        this._reset();
    },

    setText: function(text) {
        $(this._el).text(text);
        this._reset();
    },

    setMinZoom: function(z) {
        this.options.minZoom = z;
        this._reset();
    },

    _click: function(e) {
        this.fire("click", e);
    },

    _drag: function() {
        var pos = L.DomUtil.getPosition(this._el);
        this._latlng = this._map.layerPointToLatLng(pos);

        this.fire("drag");
    },

    _dragend: function(e) {
        this.fire("dragend", e);
    },

});
/* jshint browser:true, undef: true, unused: true */
/* global $, B, Display */

Display.prototype.initializeEditors = function() {
    if(this.editable()) {
        $.contextMenu({
            selector: "#map",
            items: {
                addMarker: { name: "Add Marker", callback: this._contextmenu_cmd_addmarker.bind(this) },
                addLabel: { name: "Add Label", callback: this._contextmenu_cmd_addlabel.bind(this) },
            },
            events: {
                show: this._contextmenu_show
            },
            position: this._contextmenu_position.bind(this)
        });
        
        $.contextMenu({
            selector: ".simple-label-layer",
            items: {
                edit: { name: "Edit Label", callback: this._contextmenu_cmd_editLabel.bind(this) },
                "delete": { name: "Delete Label", callback: this._contextmenu_cmd_deleteLabel.bind(this) }
            }
        });
        
        $.contextMenu({
            selector: ".leaflet-marker-icon",
            items: {
                edit: { name: "Edit Marker", callback: this._contextmenu_cmd_editMarker.bind(this) },
                "delete": { name: "Delete Marker", callback: this._contextmenu_cmd_deleteMarker.bind(this) }
            }
        });
    }
};

Display.prototype._contextmenu_show = function(e) {
    e = e;
};

Display.prototype._contextmenu_position = function(opt, x, y) {
    this._contextmenu_coordinates = [x, y];
    opt.$menu.css({top: y, left: x});
};

Display.prototype._contextmenu_cmd_addmarker = function() {
    var coords = this._contextmenu_coordinates;
    //var latlng = this.map.layerPointToLatLng(coords);
    var latlng = this.map.containerPointToLatLng(coords);

    var newMarker = this._createMarkerFromData({
        latitude: latlng.lat,
        longitude: latlng.lng,
        floor: this.floor
    });

    this.markers.push(newMarker);
    this.map.addLayer(newMarker);

    //B.storeMarker(newMarker.rawData, function(obj) {
    //    if(obj) {
    //        newMarker.rawData = obj;
    //    }
    //});
    
    this.showMarkerEditorDialog(newMarker);
};

Display.prototype._contextmenu_cmd_addlabel = function() {
    var coords = this._contextmenu_coordinates;
    //var latlng = this.map.layerPointToLatLng(coords);
    var latlng = this.map.containerPointToLatLng(coords);

    var newLabel = this._createLabelFromData({
        latitude: latlng.lat,
        longitude: latlng.lng,
        text: "newLabel",
        minZoom: this.map.getZoom(),
        floor: this.floor
    });

    this.labels.push(newLabel);
    this.map.addLayer(newLabel);

    //B.storeLabel(newLabel.rawData, function(obj) {
    //    if(obj) {
    //        newLabel.rawData = obj;
    //    }
    //});
    
    this.showLabelEditorDialog(newLabel);
};

Display.prototype._contextmenu_cmd_editLabel = function(cmd, obj)
{
    var label = obj.$trigger.data("SimpleLabel");
    this.showLabelEditorDialog(label);
};


Display.prototype._contextmenu_cmd_deleteLabel = function(cmd, obj)
{
    var label = obj.$trigger.data("SimpleLabel");
    B.deleteLabel(label.rawData, function() {
        this.map.removeLayer(label);
    }.bind(this));
};

Display.prototype.showLabelEditorDialog = function (label) {

    //label is a SimpleLabel object
    //this is the display
    var display = this;
    $("#label_minZoomLabel").text(label.rawData.minZoom);
    $("#label_minZoom").slider({
        value: label.rawData.minZoom,
        min: this.zoomOffset,
        max: this.zoomOffset + 5,
        slide: function(event, ui) {
            $("#label_minZoomLabel").text(ui.value);
        },
        
    });
    $("#label_name").val(label.rawData.text);
    
    /*var dialog =*/ $("#labelEditor").dialog({
        modal: true,
        buttons: [
            {
                text: "Delete",
                click: function() {
                    //var ok = confirm("Are you sure you want to delete this label? This cannot be undone!");
                    //if(ok) {
                        B.deleteLabel(label.rawData, function() {
                            display.map.removeLayer(label);
                        });
                        $(this).dialog("close");
                    //}
                },
                class: "delete-button"
            },
            {
                text: "Save",
                click: function() {
                    label.rawData.text = $("#label_name").val();
                    label.rawData.minZoom = $("#label_minZoom").slider("value");
                    label.setText(label.rawData.text);
                    label.setMinZoom(label.rawData.minZoom);
                    
                    B.storeLabel(label.rawData, function(obj) {
                        if(obj) {
                            label.rawData = obj;
                        }
                    });
                    $( this ).dialog( "close" );
                },
                class: "default"
            }
            
        ]
    });
};

Display.prototype.showMarkerEditorDialog = function (marker) {

    //label is a L.Label object
    //this is the display
    var display = this;
    
    $("#marker_title").val(marker.rawData.title);
    $("#marker_copy").val(marker.rawData.copy);
    
    /*var dialog =*/ $("#markerEditor").dialog({
        modal: true,
        buttons: [
            {
                text: "Delete",
                click: function() {
                    //var ok = confirm("Are you sure you want to delete this label? This cannot be undone!");
                    //if(ok) {
                        B.deleteMarker(marker.rawData, function() {
                            display.map.removeLayer(marker);
                        });
                        $(this).dialog("close");
                    //}
                },
                class: "delete-button"
            },
            {
                text: "Save",
                click: function() {
                    marker.rawData.title = $("#marker_title").val();
                    marker.rawData.copy = $("#marker_copy").val();
                    marker.bindPopup(marker.rawData.title);
                    
                    B.storeMarker(marker.rawData, function(obj) {
                        if(obj) {
                            marker.rawData = obj;
                        }
                    });
                    $( this ).dialog( "close" );
                },
                class: "default"
            }
            
        ]
    });
};

Display.prototype._contextmenu_cmd_editMarker = function()
{
    var marker = this.targetMarker;
    this.showMarkerEditorDialog(marker);
};


Display.prototype._contextmenu_cmd_deleteMarker = function()
{
    var marker = this.targetMarker;
    B.deleteMarker(marker.rawData, function() {
        this.map.removeLayer(marker);
    }.bind(this));
};

var old_createMarkerFromData = Display.prototype._createMarkerFromData;
Display.prototype._createMarkerFromData = function(data)
{
    var ret = old_createMarkerFromData.call(this, data);
    var display = this;
    
    ret.on('contextmenu', function(e) {
        var marker = e.target;
        display.targetMarker = marker;
        $(".leaflet-marker-icon").contextMenu({
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY
        });
    }, this);
    
    return ret;
};

$(document).delegate('.ui-dialog', 'keyup', function(e) {
    var tagName = e.target.tagName.toLowerCase();

    tagName = (tagName === 'input' && e.target.type === 'button') ? 'button' : tagName;

    if (e.which === $.ui.keyCode.ENTER && tagName !== 'textarea' && tagName !== 'select' && tagName !== 'button') {
        $(this).find('.ui-dialog-buttonset button.default').eq(0).trigger('click');

        return false;
    }
});
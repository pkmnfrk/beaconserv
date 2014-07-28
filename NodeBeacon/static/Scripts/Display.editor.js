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
        width: 600,
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
    var widget_data = null;
    
    if(marker.rawData.widget) {
        widget_data = marker.rawData.widget;
    } else {
        widget_data = {
            type: "none"
        };
    }
    
    if(!widget_data.perc) {
        widget_data.perc = {
            color: "#808080",
            percentage: 40
        };
    }

    $("#perc_color").val(widget_data.perc.color);
        
    
    
    $("#perc_color").on('change', function() {
        widget_data.perc.color = $(this).val();
        B.drawPieChartThing("widgetPreview", widget_data.perc);
    });
    $("#perc_value").slider({
        min: 1,
        max: 99,
        value: widget_data.perc.percentage
    }).css({
        width: 220,
        display: 'inline-block'
    }).on('slide', function(e, ui) {
        widget_data.perc.percentage = ui.value;
        B.drawPieChartThing("widgetPreview", widget_data.perc);
    });
    $("#perc_inner_label").val(widget_data.perc.innerLabel).on('keyup', function() {
        widget_data.perc.innerLabel = $(this).val().replace(/\\n/g, "\n");
        B.drawPieChartThing("widgetPreview", widget_data.perc);
    });
    $("#perc_outer_label").val(widget_data.perc.outerLabel).on('keyup', function() {
        widget_data.perc.outerLabel = $(this).val().replace(/\\n/g, "\n");
        B.drawPieChartThing("widgetPreview", widget_data.perc);
    });
    
    $("#marker_title").val(marker.rawData.title);
    $("#marker_copy").val(marker.rawData.copy);
    $("#stat_none").on('click', function() {
        $(".stat_option").hide();
        $("#widgetPreview").hide();
    });
    $("#stat_perc").on('click', function() {
        $(".stat_option").hide();
        $("#perc_options").show();
        $("#widgetPreview").show();
        B.drawPieChartThing("widgetPreview", widget_data.perc);
        widget_data.type = 'perc';
        if(!widget_data.perc) {
            widget_data.perc = {};
        }
    });

    $("#marker_file").on('change', function(e) {
        $("#marker_file_list li[data-not-uploaded]").remove();
        
        for(var i = 0; i < e.target.files.length; i++) {
            var file = e.target.files[i];
            $("<li data-not-uploaded='true'/>").text(file.name).appendTo($("#marker_file_list"));
            
        }
    });
    
    $("#stat_" + widget_data.type).click();
    
    
    
    
    
    /*var dialog =*/ $("#markerEditor").dialog({
        modal: true,
        width: 700,
        close: function() {
            $("#stat_none").off('click');
            $("#stat_perc").off('click');
            $("#marker_file").off('change');
            $("#perc_color").off('change');
        },
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
                    var self = this;
                    var whenDone = function() {
                        marker.rawData.title = $("#marker_title").val();
                        marker.rawData.copy = $("#marker_copy").val();
                        marker.rawData.widget = widget_data;
                        marker.bindPopup(marker.rawData.title);

                        B.storeMarker(marker.rawData, function(obj) {
                            if(obj) {
                                marker.rawData = obj;
                            }
                        });
                        $( self ).dialog( "close" );
                    };
                    
                    if($("#marker_file")[0].files.length) {
                        var f = 0;
                        var uploadFile = function uploadFile() {
                            var file = $("#marker_file")[0].files[f];
                            if(!file) {
                                whenDone();
                                return;
                            }
                            
                            $("#marker_file_list li[data-not-uploaded]").eq(f).append("<img src='/Content/images/ajax-loader.gif' />");
                            
                            var fr = new FileReader();
                            
                            fr.onload = function(evt) {
                                $.ajax({
                                    url: "/map/marker/" + marker.rawData._id + "/images",
                                    type: "post",
                                    headers: {
                                        "X-Filename": file.name
                                    },
                                    data: evt.target.result,
                                    contentType: file.type,
                                    processData: false,
                                    success: function(xhr, textStatus) {
                                        xhr=xhr;
                                        textStatus=textStatus;
                                        
                                    },
                                    error: function(xhr, textStatus, errorThrown) {
                                        xhr=xhr; textStatus=textStatus; errorThrown=errorThrown;
                                        
                                        
                                        
                                        alert(errorThrown);
                                        
                                    },
                                    complete: function() {
                                        $("img", $("#marker_file_list li[data-not-uploaded]").eq(f)).remove();
                                        f++;
                                        uploadFile();
                                    }
                                });
                            };
                            
                            fr.readAsDataURL(file);
                            
                        };
                        
                        uploadFile();
                    } else {
                        whenDone();
                    }
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
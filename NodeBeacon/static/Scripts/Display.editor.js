
Display.showEditorDialog = function () {
    if(!show_labels) return;
    
    var self = this;
    var label = this.label;
    if(!label.minZoom)
        label.minZoom = zoomOffset;
    
    $("#beacon_minZoomLabel").text(label.minZoom);
    $("#beacon_minZoom").slider({
        value: label.minZoom,
        min: zoomOffset,
        max: zoomOffset + 5,
        slide: function(event, ui) {
            $("#beacon_minZoomLabel").text(ui.value);
        },
        
    });
    $("#beacon_name").val(beacon.title);
    
    var dialog = $("#editor").dialog({
        modal: true,
        buttons: [
            {
                text: "Delete",
                click: function() {
                    var ok = confirm("Are you sure you want to delete this label? This cannot be undone!");
                    if(ok) {
                        //B.deleteBeacon(beacon);
                        $(this).dialog("close");
                    }
                },
                class: "delete-button"
            },
            {
                text: "Save",
                click: function() {
                    label.text = $("#beacon_name").val();
                    label.minZoom = $("#beacon_minZoom").slider("value");
                    label.label.setText(label.text);
                    label.label.setMinZoom(label.minZoom);

                    label.latitude = label.marker.getLatLng().lat;
                    label.longitude = label.marker.getLatLng().lng;

                    //B.saveBeacon(beacon);
                    B.storeLabel(label);
                    $( this ).dialog( "close" );
                },
            }
            
        ]
    });
};
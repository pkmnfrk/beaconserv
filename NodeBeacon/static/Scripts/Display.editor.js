/* jshint browser:true, undef: true, unused: true */
/* global $, B, display */

display.showEditorDialog = function (label) {
    if(!display.shouldShowLabels()) return;
    
    
    $("#beacon_minZoomLabel").text(label.getMinZoom());
    $("#beacon_minZoom").slider({
        value: label.getMinZoom(),
        min: display.zoomOffset,
        max: display.zoomOffset + 5,
        slide: function(event, ui) {
            $("#beacon_minZoomLabel").text(ui.value);
        },
        
    });
    $("#beacon_name").val(label.getText());
    
    /*var dialog =*/ $("#editor").dialog({
        modal: true,
        buttons: [
            {
                text: "Delete",
                click: function() {
                    //var ok = confirm("Are you sure you want to delete this label? This cannot be undone!");
                    //if(ok) {
                        //B.deleteBeacon(beacon);
                        $(this).dialog("close");
                    //}
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
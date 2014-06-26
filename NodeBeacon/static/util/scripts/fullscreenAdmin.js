
$(".draggable").draggable({
    revert: true,
    revertDuration: 0
});

$.ajax({
    url: "/fullscreen/config",
    success: function(data) {

        $(".screen").each(function(i, el) {
            var id = $(el).attr("id");
            
            if(data.hasOwnProperty(id)) {
                for(var p in data[id]) {
                    if(data[id].hasOwnProperty(p)) {
                        $("." + p, el).text(data[id][p]);
                    }
                }
                
            }
        });
        
        $(".screen").droppable({
            hoverClass: "screenDrop",
            drop: function(event, ui) {
                var src = $(ui.draggable).parent();
                var id = $(this).attr("id");
                
                var name = $(".name", src).val();
                var url = $(".url", src).val();
                
                $(".name", this).text(name);
                $(".url", this).text(url);
                
                $.ajax({
                    url: "/fullscreen/" + id,
                    method: "PUT",
                    data: JSON.stringify({
                        name: name, url: url
                    }),
                    contentType: "application/json"
                });
            }
        });

    }
});

$(".screen button").click(function(e) {
    
    var id = $(this).parent().attr("id");
    
    $.ajax({
        url: "/fullscreen/refresh/" + id,
        method: "POST"
    });
});

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
                
                if(src.data("kind") === "clock") {
                    if(!$(".eventName", src).val() || !$(".eventDate", src).val()) {
                        return;
                    }
                    
                    url += "?name=" + encodeURIComponent($(".eventName", src).val());
                    url += "&date=" + encodeURIComponent($(".eventDate", src).val());
                    url += "&fgcolor=" + encodeURIComponent($(".eventFG", src).val());
                    url += "&bgcolor=" + encodeURIComponent($(".eventBG", src).val());
                    url += "&showseconds=" + encodeURIComponent($(".eventSeconds", src)[0].checked);
                } else if(src.data("kind") === "worldcup") {
                    if(!$(".leftTeam", src).val() || !$(".rightTeam", src).val()) {
                        return;
                    }
                    
                    url += "?leftTeam=" + encodeURIComponent($(".leftTeam", src).val());
                    url += "&rightTeam=" + encodeURIComponent($(".rightTeam", src).val());
                    url += "&leftColor=" + encodeURIComponent($(".leftColor", src).val());
                    url += "&rightColor=" + encodeURIComponent($(".rightColor", src).val());
                } else if(src.data("kind") === "youtube") {
                    url += "?code=" + encodeURIComponent($(".code", src).val());
                    if($(".time", src).val()) {
                        url += "&time=" + encodeURIComponent($(".time", src).val());
                    }
                } else if(src.data("kind") === "url") {
                    if(!$(".url", src).val()) {
                        return;
                    }
                }
                
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

$(".advanced span").hide();
$(".advanced a").click(function(e) {
    e.preventDefault();
    $("span", $(this).parent()).show();
    $(this).hide();
});
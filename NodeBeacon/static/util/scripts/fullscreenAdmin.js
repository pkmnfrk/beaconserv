
$(".draggable").draggable({
    revert: true,
    revertDuration: 0
});

function getData(src) {

    var name = $(".name", src).val();
    var url = $(".url", src).val();

    if(src.data("kind") === "clock") {
        if(!$(".eventName", src).val() || !$(".eventDate", src).val()) {
            return null;
        }

        url += "?name=" + encodeURIComponent($(".eventName", src).val());
        url += "&date=" + encodeURIComponent($(".eventDate", src).val());
        url += "&fgcolor=" + encodeURIComponent($(".eventFG", src).val());
        url += "&bgcolor=" + encodeURIComponent($(".eventBG", src).val());
        url += "&showseconds=" + encodeURIComponent($(".eventSeconds", src)[0].checked);
    } else if(src.data("kind") === "worldcup") {
        if(!$(".leftTeam", src).val() || !$(".rightTeam", src).val()) {
            return null;
        }

        url += "?leftTeam=" + encodeURIComponent($(".leftTeam", src).val());
        url += "&rightTeam=" + encodeURIComponent($(".rightTeam", src).val());
        url += "&leftColor=" + encodeURIComponent($(".leftColour", src).val());
        url += "&rightColor=" + encodeURIComponent($(".rightColour", src).val());
    } else if(src.data("kind") === "youtube") {
        url += "?code=" + encodeURIComponent($(".code", src).val());
        if($(".time", src).val()) {
            url += "&time=" + encodeURIComponent($(".time", src).val());
        }
    } else if(src.data("kind") === "url") {
        if(!$(".url", src).val()) {
            return null;
        }
    }
    
    return { url: url, name: name };
}

function createScheduleEntry(data) {
    return $("<li/>")
        .data("url", data.url)
        .data("name", data.name)
        .text(" - " + data.name)
        .prepend($("<input />")
                    .attr("name", "time")
                    .addClass("time")
                    .val(data.time ? data.time : "13:00")
                );
}

$.ajax({
    url: "/fullscreen/config",
    success: function(data) {

        $(".screen").each(function(i, el) {
            var id = $(el).parent().attr("id");
            
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
                var id = $(this).parent().attr("id");
                
                var data = getData(src);
                
                if(!data) return;
                
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
    
    var id = $(this).parent().parent().attr("id");
    
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

$(".addNew").droppable({
    accept: function(el){
        if(el.parent().hasClass("s")) return true;
    },
    drop: function(event, ui) {
        var src = $(ui.draggable).parent();
        var list = $(this).parent();
        var id = list.parent().attr("id");

        var data = getData(src);
        
        if(!data) return;
        
        var newEl = createScheduleEntry(data);
        
        
        $(newEl).insertBefore(this);
        
    }
});
//$(document).bind('touchmove', false);

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
    } else if(src.data("kind") === "feed") {
        url += "?feed=" + encodeURI($(".feed", src).val());
    } else if(src.data("kind") === "text") {
        url += "?text=" + encodeURIComponent($(".text", src).val());
        url += "&size=" + encodeURIComponent($(".size", src).val());
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
                    .attr("placeholder", "hh:mm pm")
                    .addClass("time")
                    .val(data.time)
                    .blur(function(e) {
                        saveSchedule($(this).closest(".screenContainer"));
                    })
        )
        .append(
            $("<button/>")
            .attr("type", "button")
            .text("X")
            .click(removeEntry)
        )
        ;
}

function getScheduleData(el) {
    return {
        url: $(el).data("url"),
        name: $(el).data("name"),
        time: $("input[name=\"time\"]", el).val()
    };
}

function getSchedule(el) {
    var items = $(".schedule li", el);
    var ret = [];
    
    for(var i = 0; i < items.length - 1; i++) {
        ret.push(getScheduleData(items[i]));
    }
    
    ret.sort(function(a, b) {
        var at = parseTime(a.time);
        var bt = parseTime(b.time);
        return at - bt;
    });
    
    return ret;
}

function saveSchedule(parent) {
    var id = parent.attr("id");
    
    var schedule = getSchedule(parent);
    
    $.ajax({
        url: "/fullscreen/" + id + "/schedule",
        method: "PUT",
        data: JSON.stringify(schedule),
        contentType: "application/json"
    });
    //alert(JSON.stringify(schedule));
}

function removeEntry() {
    var el = $(this).closest(".screenContainer");
    
    $(this).parent().remove();
    saveSchedule(el);
}

function setScreenFromElement(src, screen) {
    var id = $(screen).parent().attr("id");
                
    var data = getData(src);

    if(!data) return;

    $(".name", this).text(data.name);
    $(".url", this).text(data.url);
    
    $.ajax({
        url: "/fullscreen/" + id + "/current",
        method: "PUT",
        data: JSON.stringify({
            name: data.name, url: data.url
        }),
        contentType: "application/json"
    });
}

$.ajax({
    url: "/fullscreen/config",
    success: function(data) {

        $(".screen").each(function(i, el) {
            var id = $(el).parent().attr("id");
            
            if(data.hasOwnProperty(id)) {
                for(var p in data[id]) {
                    if(data[id].hasOwnProperty(p)) {
                        if(p === "schedule") {
                            var sched = $(".addNew", $(el).parent());
                            for(var q = 0; q < data[id][p].length; q++) {
                                
                                $(createScheduleEntry(data[id][p][q])).insertBefore(sched);
        
                            }
                            
                        } else {
                            $("." + p, el).text(data[id][p]);
                        }
                    }
                }
                
            }
        });
        
        $(".screen").droppable({
            hoverClass: "screenDrop",
            drop: function(event, ui) {
                var src = $(ui.draggable).parent();
                
                setScreenFromElement(src, this);
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
        
        
        $("input", newEl)[0].focus();
        //$("input", newEl)[0].select();
        
    }
})
/*.click(function(e) {
    alert(JSON.stringify(getSchedule($(this).closest(".screenContainer"))));
})*/;
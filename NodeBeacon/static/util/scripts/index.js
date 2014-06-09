(function() {
    "use strict";
    
    var evtHandlers = {
        onTimelineScroll: function (e) {
            var x = $(this).scrollLeft();
            $(".timeline").scrollLeft(x);
        }
    };
    
    var actualLength = 0;
    var ensureTimelineLength = function (data) {
       
        var totalLength = 0;
        var curLength = 0;

        var tasks = {};
        
        for(var t = 0; t < data.team.length; t++) {
            
                var teamMember = data.team[t];
                curLength = 0;
                if(teamMember.tasks) {
                    for(var a = 0; a < teamMember.tasks.length; a++) {
                        var task = teamMember.tasks[a];
                        tasks[task.id] = task;
                        
                        if(task.dependencies && task.dependencies.length) {
                            for(var d = 0; d < task.dependencies.length; d++) {
                                var depTask = tasks[task.dependencies[d]];
                                if(depTask.offset + depTask.length > curLength) {
                                    curLength = depTask.offset + depTask.length;
                                    
                                }
                            }
                        }
                        
                        task.offset = curLength;
                        curLength += task.length;
                    }
                }

                if(curLength > totalLength)
                    totalLength = curLength;
            
        }

        while(totalLength > actualLength) {
            $(".timeline").append("<div class='timeline-seg'></div>");
            actualLength++;
        }
    };
    
    var data = {
        options: {
          segmentWidth: 100
        },
        team: [
            {
                id: 1,
                name: "JJ",
                tasks: [
                    {
                        id: 1,
                        name: "Update foobar",
                        ticket: 123456,
                        length: 6
                    },
                    {
                        id: 3,
                        name: "Frob widget",
                        ticket: 123456,
                        length: 4
                    },
                    {
                        id: 4,
                        name: "Capitulate nuggets",
                        ticket: 123456,
                        length: 8
                    }
                ]
                
            },
            {
                id: 2,
                name: "Ken",
                tasks: [
                    {
                        id: 2,
                        name: "Blah blah",
                        ticket: 123457,
                        length: 1
                    },
                    {
                        id: 5,
                        name: "Bar Baz",
                        ticket: 123456,
                        length: 7
                    }
                    
                ]
            },
            {
                id: 3,
                name: "Mike",
                tasks: [
                    {
                        id: 6,
                        name: "Update foobar",
                        ticket: 123456,
                        length: 2
                    },
                    {
                        id: 7,
                        name: "Update foobar",
                        ticket: 123456,
                        length: 1
                    },
                    {
                        id: 8,
                        name: "Update foobar",
                        ticket: 123456,
                        length: 3,
                        dependencies: [5]
                    }
                    
                ]
                
            },
            {
                id: 4,
                name: "Keith"
            }

        ]
    };

    var mapping = {
        team: {
            key: function(data) {
                return ko.utils.unwrapObservable(data.id);
            }
        }
    };

    ensureTimelineLength(data);
    

    var viewModel = ko.mapping.fromJS(data);
    
    ko.applyBindings(viewModel);
    
    
    $(".timeline").scroll(evtHandlers.onTimelineScroll);
    
})();


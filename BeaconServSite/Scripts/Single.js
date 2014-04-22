var animation = false,
    animationstring = 'animation',
    keyframeprefix = '',
    domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
    pfx = '';
var elm = document.body;

if (elm.style.animationName !== undefined) { animation = true; }

if (animation === false) {
    for (var i = 0; i < domPrefixes.length; i++) {
        if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
            pfx = domPrefixes[i];
            animationstring = pfx + 'Animation';
            keyframeprefix = '-' + pfx.toLowerCase() + '-';
            animation = true;
            break;
        }
    }
}

var animEndEventNames = {
    'Webkit': 'webkitAnimationEnd',
    'ms': 'MSAnimationEnd',
    '': 'animationend'
};

var animEndEventName = animEndEventNames[pfx];


$("#page1,#page2").each(function () {
    var $page = $(this);
    $page.data('originalClassList', $page.attr('class'));
});

$("#page1").addClass("pt-page-current")


function SinglePageModel() {
    var self = this;

    self.currentCard = ko.observable(null);
    self.animating = ko.observable(false);
    self.isSearching = ko.observable(true);

    self.openPage = function (onComplete, quick) {
        self.doTransition(true, onComplete, quick);
    }

    self.closePage = function (onComplete, quick) {
        self.doTransition(false, onComplete, quick);
    }

    self.animationQueue = ko.observableArray([]);
    
    self.doTransition = function (trueIfOpen, onComplete, quick) {
        var endCurrPage = false, endNextPage = false;
        
        if (self.animating()) {
            self.animationQueue.push({ trueIfOpen: trueIfOpen, onComplete: onComplete, quick: quick });
            return;
        }

        self.animating(true);
        self.isSearching(false);

        var inPage, outPage;
        var inClass, outClass;
        
        if (!trueIfOpen) {
            outPage = $("#page2");
            inPage = $("#page1");
            outClass = "pt-page-moveToRight pt-page-ontop" + (quick ? " pt-quick" : "");
            inClass = "pt-page-scaleUp";
        } else {
            outPage = $("#page1");
            inPage = $("#page2");
            outClass = "pt-page-scaleDown";
            inClass = "pt-page-moveFromRight pt-page-ontop" + (quick ? " pt-quick" : "");
        }

        var onEndAnimation = function onEndAnimation($outpage, $inpage) {
            endCurrPage = false;
            endNextPage = false;
            resetPage($outpage, $inpage);
            self.animating(false);
            if (onComplete) onComplete();

            if (self.animationQueue.length) {
                var aq = self.animationQueue.shift();
                self.doTransition(aq.trueIfOpen, aq.onComplete, aq.quick);
            } else {
                self.isSearching(true);
            }
        };

        var resetPage = function resetPage($outpage, $inpage) {
            $outpage.attr('class', $outpage.data('originalClassList'));
            $inpage.attr('class', $inpage.data('originalClassList') + ' pt-page-current');
        };

        outPage.addClass(outClass).on(animEndEventName, function () {
            outPage.off(animEndEventName);

            endCurrPage = true;

            if (endNextPage) {
                onEndAnimation(outPage, inPage);
            }
        });

        inPage.addClass("pt-page-current").addClass(inClass).on(animEndEventName, function () {
            inPage.off(animEndEventName);

            endNextPage = true;

            if (endCurrPage) {
                onEndAnimation(outPage, inPage);
            }

        });

        

        


    }

    self.nextIsQuick = false;

    window.didEnterForeground_func = function () {
        self.nextIsQuick = true;
    };

    window.beacon_func = function (beacon_id, major, minor, device_id, proximity) {
       
        if (!proximity) proximity = 4;

        if (beacon_id == null) {

            if (self.currentCard()) {
                self.isSearching(true);
                self.closePage(function () {
                    self.currentCard(null);
                });
            }
            return;

        }

        if (self.currentCard()) {
           if (self.currentCard().beacon_id == beacon_id
                && self.currentCard().major == major
                && self.currentCard().minor == minor) {

                return;
            }
        }

        jQuery.ajax({
            type: "POST",
            url: "/state/ping/" + beacon_id + "/" + major + "/" + minor,
            data: { device_id: device_id },
            dataType: "json",
            complete: function (datar, textStatus) {
                var data = datar.responseJSON;

                var newCard = {
                    beacon_id: beacon_id,
                    major: major,
                    minor: minor,
                    title: data.title,
                    body: data.bodyText,
                    url: data.url,
                    image: data.image,
                    video: data.video,
                    proximity: proximity
                };

                if (self.currentCard()) {
                    self.closePage(function () {
                        self.currentCard(newCard);
                        self.openPage(null, self.nextIsQuick);
                    }, self.nextIsQuick)
                } else {
                    self.currentCard(newCard);
                    self.openPage(null, self.nextIsQuick);
                }
                if (self.nextIsQuick) {
                    self.nextIsQuick = false;
                }
            }
        });
    };
}


ko.applyBindings(new SinglePageModel());
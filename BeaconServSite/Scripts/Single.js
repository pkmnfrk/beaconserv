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
    self.animating = false;

    
    self.doTransition = function (obj, evt) {
        var endCurrPage = false, endNextPage = false;
        
        if (self.animating) return;

        self.animating = true;

        var inPage, outPage;
        var inClass, outClass;
        
        if (self.currentCard()) {
            outPage = $("#page2");
            inPage = $("#page1");
            outClass = "pt-page-moveToRight pt-page-ontop";
            inClass = "pt-page-scaleUp";
            self.currentCard(null);
        } else {
            outPage = $("#page1");
            inPage = $("#page2");
            outClass = "pt-page-scaleDown";
            inClass = "pt-page-moveFromRight pt-page-ontop";
            self.currentCard({});
        }

        var onEndAnimation = function onEndAnimation($outpage, $inpage) {
            endCurrPage = false;
            endNextPage = false;
            resetPage($outpage, $inpage);
            self.animating = false;
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

}


ko.applyBindings(new SinglePageModel());
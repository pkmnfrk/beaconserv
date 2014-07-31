function onOrientationChange() {
    window.scroll(0, 0);
}

window.addEventListener("orientationchange", onOrientationChange);

var display;

$(function() {
    display = new Display();

    display.createMap("map");

    window.focusOnClient = function() {
        display.focusOnClient.apply(this, arguments);
    };
});
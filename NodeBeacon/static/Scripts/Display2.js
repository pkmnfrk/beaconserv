

var display = new Display();

display.createMap("map");

window.addEventListener("orientationchange", onOrientationChange);

function onOrientationChange() {
    window.scroll(0, 0);
}

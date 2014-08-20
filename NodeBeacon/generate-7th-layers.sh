#!/bin/sh

UTIL="mono /Users/mike/node/beaconserv/MapChop/bin/Debug/MapChop.exe"
DEST="/Users/mike/node/beaconserv/NodeBeacon/static/Content/maps"

cd /Users/mike/Google\ Drive/Labs/Klick\ Pulse/PSD

$UTIL base_map.png "$DEST/floor_7"
$UTIL Creative.png "$DEST/7th_Creative"
$UTIL Editorial.png "$DEST/7th_Editorial"
$UTIL Labs.png "$DEST/7th_Labs"
$UTIL pm.png "$DEST/7th_pm"
$UTIL web_app_dev.png "$DEST/7th_web_app_dev"
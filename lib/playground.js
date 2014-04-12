var activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
var {Cc, Ci} = require("chrome");
 
// Ask the user to confirm that they want to share their location.
// If they agree, call the geolocation function, passing the in the
// callback. Otherwise, call the callback with an error message.
function getCurrentPositionWithCheck(callback) {
    let pref = "extensions.whereami.allowGeolocation";
    let message = "whereami Add-on wants to know your location."
    let branch = Cc["@mozilla.org/preferences-service;1"]
               .getService(Ci.nsIPrefBranch2);
    if (branch.getPrefType(pref) === branch.PREF_STRING) {
        switch (branch.getCharPref(pref)) {
        case "always":
            return getCurrentPosition(callback);
        case "never":
            return callback(null);
        }
    }
    let done = false;

    function remember(value, result) {
        return function () {
            done = true;
            branch.setCharPref(pref, value);
            if (result) {
                getCurrentPosition(callback);
            } else {
                callback(null);
            }
        }
    }
 
    let self = activeBrowserWindow.PopupNotifications.show(
        activeBrowserWindow.gBrowser.selectedBrowser,
        "geolocation",
        message,
        "geo-notification-icon",
        {
            label: "Share Location",
            accessKey: "S",
            callback: function (notification) {
                done = true;
                getCurrentPosition(callback);
            }
        }, [{
                label: "Always Share",
                accessKey: "A",
                callback: remember("always", true)
            }, {
                label: "Never Share",
                accessKey: "N",
                callback: remember("never", false)
        }], {
            eventCallback: function (event) {
                if (event === "dismissed") {
                    if (!done)
                        callback(null);
                    done = true;
                    PopupNotifications.remove(self);
                }
            },
            persistWhileVisible: true
        }
    );
}
 
// Implement getCurrentPosition by loading the nsIDOMGeoGeolocation
// XPCOM object.
function getCurrentPosition(callback) {
    var xpcomGeolocation = Cc["@mozilla.org/geolocation;1"]
                      .getService(Ci.nsIDOMGeoGeolocation);
    xpcomGeolocation.getCurrentPosition(callback);
}
 
var widget = require("sdk/widget").Widget({
    id: "whereami",
    label: "Where am I?",
    contentURL: "http://www.mozilla.org/favicon.ico",
    onClick: function() {
        getCurrentPositionWithCheck(function(position) {
            if (!position) {
                console.log("The user denied access to geolocation.");
            } else {
                console.log("latitude: ", position.coords.latitude);
                console.log("longitude: ", position.coords.longitude);
            }
        });
    }
});

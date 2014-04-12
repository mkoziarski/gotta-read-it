self.port.on("response", function(results) {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("bookmark-response", true, true, results);
    document.documentElement.dispatchEvent(event);
});

document.documentElement.addEventListener("bookmark-query", function(event) {
    self.port.emit('bookmarks', event.detail);
}, false);

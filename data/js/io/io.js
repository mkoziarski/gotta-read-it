self.port.on("response", function(response) {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("bookmark-response", true, true, response);
    document.documentElement.dispatchEvent(event);
});

document.documentElement.addEventListener("bookmark-query", function(event) {
    self.port.emit('bookmarks', event.detail);
}, false);

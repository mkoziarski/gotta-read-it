var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;
var bookmarks = require("./bookmarks");
var tags = require("./tags");

var widget = widgets.Widget({
    id: "open-tab",
    label: "Open a tab",
    contentURL: data.url('img/icon-list.png'),
    onClick: function() {
        tabs.open({
            url: data.url('index.html'),
            onOpen: function onOpen(tab) {
                tab.on('ready', function() {
                    var worker = tab.attach({
                        contentScriptFile: data.url('js/io/io.js')
                    });
                    worker.port.on("bookmarks", function(request) {
                        bookmarks.respond(request, worker.port);
                    });
                });
            }
        });
    }
});

var widget = widgets.Widget({
    id: "process-tab",
    label: "Process this tab and test bookmarks",
    contentURL: data.url('img/icon-excl.png'),
    onClick: function() {
        bookmarks.test();
        console.log(tags.tags());
    }
});

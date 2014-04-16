var { ActionButton } = require("sdk/ui/button/action");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;
var bookmarks = require("./bookmarks");

var button = ActionButton({
    id: "gotta-read-it",
    label: "Gotta read it",
    icon: {
        "16": data.url('img/icon-16.png'),
        "32": data.url('img/icon-32.png')
    },
    onClick: function(state) {
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

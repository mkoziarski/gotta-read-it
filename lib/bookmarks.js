let { Bookmark, Group, search, save } = require("sdk/places/bookmarks");

let bookmarks = [
    Bookmark({ title: "Ran", url: "http://ranguitars.com", tags: ['guitars'] }),
    Bookmark({ title: "Ibanez", url: "http://ibanez.com", tags: ['guitars'] }),
    Bookmark({ title: "ESP", url: "http://espguitars.com", tags: ['guitars'] })
];

let test = function test() {
    save(bookmarks).on("data", function (saved, input) {
        // A data event is called once for each item saved, as well
        // as implicit items, like `group`
        console.log(~bookmarks.indexOf(input)); // true
    }).on("end", function (saves, inputs) {
        // like the previous example, the "end" event returns an
        // array of all of our updated saves. Only explicitly saved
        // items are returned in this array -- the `group` won't be
        // present here.
        console.log(saves[0].title); // "Ran"
    });
};

let searchMethod = function(consume) {
    search({ tags: ['guitars'] }).on('end', consume);
};

let respond = function(request, port) {
    function consume(results) {
        port.emit('response', results);
    };
    searchMethod(consume);
};

exports.test = test;
exports.respond = respond;

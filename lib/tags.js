let {Cc, Ci} = require("chrome");
let tagService = Cc["@mozilla.org/browser/tagging-service;1"]
        .getService(Ci.nsITaggingService);

let tags = function tags() {
    return tagService.allTags;
}

exports.tags = tags;

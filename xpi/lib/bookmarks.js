let { Bookmark, Group, search, save } = require("sdk/places/bookmarks");
let tags = require("./tags");
let ss = require("sdk/simple-storage");
if (!ss.storage.cats)
    ss.storage.cats = {};
if (!ss.storage.catList)
    ss.storage.catList = [];
if (!ss.storage.todoTag)
    ss.storage.todoTag = '';
let cats = ss.storage.cats;
let catList = ss.storage.catList;
let todoTag = ss.storage.todoTag;


let searchMethod = function(query, consume) {
    search(query, { sort: 'dateAdded', descending: true }).on('end', consume);
};

let orderMethod = function(request) {
    var list, index, src, from, to, i;
    console.log('reordering items');
    if (!cats[request.groupId])
        cats[request.groupId] = {
            list: [],
            index: {}
        };
    list = cats[request.groupId].list;
    index = cats[request.groupId].index;
    src = index[request.itemId];

    // don't change the list if src == dest
    if (Number.isInteger(src) && request.dest == src)
        return

    if (Number.isInteger(src)) {
        console.log('list len ' + list.length);
        console.log('splice');
        list.splice(src, 1);
        from = src;
        to = list.length - 1;
        console.log('list len ' + list.length);
    }

    if (Number.isInteger(request.dest)) {
        list.splice(request.dest, 0, request.itemId);
        if (Number.isInteger(from)) {
            if (request.dest > from) {
                to = request.dest;
            } else {
                to = from;
                from = request.dest;
            }
        } else {
            from = request.dest;
            to = list.length - 1;
        }
    } else {
        delete index[request.itemId];
    }

    // reindex list
    if (Number.isInteger(from)) {
        for (i = from; i <= to; i++) {
            index[list[i]] = i;
        }
    }
};

let updateCatList = function(request) {
    var cat = request.cat,
        i;

    catList.forEach(function(item, idx) {
        if (item == cat)
            i = idx;
    });

    if (request.add) {
        if (!Number.isInteger(i))
            catList.push(cat);
    } else {
        if (Number.isInteger(i))
            catList.splice(i, 1);
    }
};

let setFilterTag = function(request) {
    ss.storage.todoTag = request.filterTag;
    todoTag = ss.storage.todoTag;
}

let respond = function(request, port) {
    function consume(results) {
        // reflect user ordering here
        var groupId = queryTags.join('-');
        var groupData = cats[groupId];
        var queued = [];
        var qChecked = [];
        var latest = [];
        if (groupData && groupData.list.length) {
            groupData.list.forEach(console.log);
            console.log('user-ordered items present');
            var queueLen = groupData.list.length;
            console.log('queueLen ' + queueLen);
            queued.length = queueLen;
            results.forEach(function(item, idx, array) {
                if (Number.isInteger(groupData.index[item.id])) {
                    console.log('item ' + item.title);
                    console.log('put at pos ' + groupData.index[item.id]);
                    // insert at the user-specified index
                    queued[groupData.index[item.id]] = item;
                } else {
                    // append to the end of the returned list
                    latest.push(item);
                }
            });
        } else {
            console.log('no user-defined ordering');
            latest = results;
        }
        // end ordering

        // check for missing items
        queued.forEach(function(item) {
            if (item)
                qChecked.push(item);
        });
        var response = {
            tags: queryTags,
            queued: qChecked,
            latest: latest
        };
        port.emit('response', response);
    };
    // TODO
    var queryTags;
    
    if ('get' == request.action && request.query.tags) {
        queryTags = JSON.parse(JSON.stringify(request.query.tags));
        if (todoTag)
            request.query.tags.push(todoTag);
        searchMethod(request.query, consume);
    }

    if ('order' == request.action) {
        orderMethod(request);
    }

    if ('getCatList' == request.action) {
        var response = { cats: catList };
        port.emit('response', response);
    }

    if ('getAllTags' == request.action) {
        var response = { allTags: tags.tags() };
        port.emit('response', response);
    }

    if ('updateCatList' == request.action) {
        updateCatList(request);
        var response = { cats: catList };
        port.emit('response', response);
    }

    if ('getFilterTag' == request.action) {
        var response = { filterTag: todoTag };
        port.emit('response', response);
    }

    if ('setFilterTag' == request.action) {
        setFilterTag(request);
        var response = { filterTag: todoTag, updated: true };
        port.emit('response', response);
    }
};

exports.respond = respond;

define(['domReady', 'sugarDom'], function(domReady, el) {
    function receiveData(event) {
        var i, results = event.detail;

        for (i = 0; i < results.length; i++) {
            var box = el('div', [
                results[i].title
            ]);
            document.body.appendChild(box);
            console.log(results[i].tags);
        }
    }

    function getBookmarks() {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent("bookmark-query", true, true, { foo: 'foo' });
        document.documentElement.dispatchEvent(event);
    }

    domReady(function() {
        document.documentElement.addEventListener("bookmark-response", receiveData, false);
        getBookmarks();
    });
});

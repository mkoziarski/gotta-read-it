define(['domReady', 'sugarDom'], function(domReady, el) {
    function receiveData(event) {
        function isDropAllowed(transfer, target) {
            var payload;

            if (!transfer.types.contains('application/x-bookmark-item'))
                return false;

            payload = transfer.getData('application/x-bookmark-item');
            payload = JSON.parse(payload);
            if (payload.groupId != groupId)
                return false;
            if (payload.id == target.id)
                return false;
            return true;
        }

        function onDragEnter(event) {
            var transfer = event.dataTransfer;
            if (isDropAllowed(transfer, this)) {
                event.preventDefault();
            }
        }

        function onDragOver(event) {
            var transfer = event.dataTransfer;
            if (isDropAllowed(transfer, this)) {
                event.preventDefault();
                this.classList.add('displace-anim');
                this.classList.add('displaced');
            }
        }

        function onDragLeave(event) {
            var that = this;

            this.classList.remove('displaced');
            // TODO use transitionend rather than timeout
            setTimeout(function() {
                that.classList.remove('displace-anim');
            }, 500);
        }

        function onDrop(event) {
            var transfer = event.dataTransfer,
                payloadJSON, payload,
                srcParent, srcNode, srcIdx, newParent, newNode, newIdx;

            console.log('drop');
            payloadJSON = transfer.getData('application/x-bookmark-item');
            payload = JSON.parse(payloadJSON);

            srcNode = document.getElementById(payload.id);
            if (srcNode.dataset && srcNode.dataset.index)
                srcIdx = parseInt(srcNode.dataset.index);
            srcParent = srcNode.parentElement;
            srcParent.removeChild(srcNode);

            newNode = el('li#' + payload.id, {
                'data-id': payload.itemId,
                'data-group-id': payload.groupId,
                draggable: true
            }, [
                el('a', { href: payload.url, target: '_blank', draggable: false }, [
                    payload.title
                ])
            ]);
            newNode.addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('application/x-bookmark-item', payloadJSON);
                event.dataTransfer.effectAllowed = 'move';
                this.classList.add('hidden');
            });
            newNode.addEventListener('dragenter', onDragEnter);
            newNode.addEventListener('dragover', onDragOver);
            newNode.addEventListener('dragleave', onDragLeave);
            newNode.addEventListener('drop', onDrop);
            newNode.addEventListener('dragend', onDragEnd);

            this.classList.remove('displace-anim');
            this.classList.remove('displaced');
            newParent = this.parentElement;
            newParent.insertBefore(newNode, this);
            if (newNode.previousElementSibling) {
                newIdx = parseInt(newNode.previousElementSibling.dataset.index) + 1;
            } else {
                newIdx = 0;
            }
            if (srcIdx && newIdx > srcIdx)
                newIdx--;

            reindexImportant();
            moveItem(groupId, payload.itemId, srcIdx, newIdx);

            event.preventDefault();
        }

        function onDragEnd(event) {
            var displaced = document.querySelectorAll('.displaced'),
                transfer = event.dataTransfer,
                payload = JSON.parse(transfer.getData('application/x-bookmark-item')),
                srcNode, i;

            console.log('dragend');
            for (i = 0; i < displaced.length; i++) {
                displaced[i].classList.remove('displaced');
                setTimeout(function() {
                    displaced[i].classList.remove('displace-anim');
                }, 500);
            }

            srcNode = document.getElementById(payload.id);
            if (srcNode) {
                // show if hidden
                srcNode.classList.remove('hidden');
            }
        }

        function addItem(item, queued, itemIndex) {
            var elId = groupId + '-' + item.id;
            var li = el('li#' + elId, {
                    'data-id': item.id,
                    'data-group-id': groupId,
                    'data-index': itemIndex,
                    draggable: true
            }, [
                el('a', { href: item.url, target: '_blank', draggable: false }, [
                    item.title
                ])
            ]);

            li.addEventListener('dragstart', function(event) {
                /*function onTransitionEnd(event) {
                    if ('height' == event.propertyName) {
                        this.classList.add('hidden');
                        this.removeEventListener('transitionend', onTransitionEnd);
                    }
                }*/
                var data = JSON.stringify({
                    id: elId,
                    groupId: groupId,
                    itemId: item.id,
                    url: item.url,
                    title: item.title
                });
                event.dataTransfer.setData('application/x-bookmark-item', data);
                event.dataTransfer.effectAllowed = 'move';
                /*this.classList.add('shrink-anim');
                this.addEventListener('transitionend', onTransitionEnd);
                this.classList.add('shrinked');*/
                this.classList.add('hidden');
            });

            if (queued) {
                li.addEventListener('dragenter', onDragEnter);
                li.addEventListener('dragover', onDragOver);
                li.addEventListener('dragleave', onDragLeave);
                li.addEventListener('drop', onDrop);
            }

            li.addEventListener('dragend', onDragEnd);

            return li;
        }

        function reindexImportant() {
            var ul = document.querySelector('#' + groupId + ' .important'),
                index = 0,
                li = ul.firstElementChild;

            while (li) {
                li.dataset.index = index;
                index++;
                li = li.nextElementSibling;
            }
        }

        function setupFakeItem(item) {
            item.addEventListener('dragenter', onDragEnter);
            item.addEventListener('dragover', onDragOver);
            item.addEventListener('dragleave', onDragLeave);
            item.addEventListener('drop', onDrop);
        }

        function insertCat(box) {
            var list = columns[columnsById[box.id][0]],
                idx = columnsById[box.id][1],
                nextSibling, parent, i;

            for (i = idx + 1; i < list.length; i++) {
                nextSibling = document.getElementById(list[i]);
                if (nextSibling)
                    break;
            }

            if (nextSibling) {
                parent = nextSibling.parentNode;
                parent.insertBefore(box, nextSibling);
            } else {
                parent = document.getElementById('column-' + columnsById[box.id][0]);
                parent.appendChild(box);
            }
        }

        var i, response = event.detail,
            // TODO are the tags always there?
            groupId = response.tags.join('-'),
            count = groups.length,
            gutter = 3,
            itemIndex = 0,
            qFake = el('li.fake'),
            lFake = el('li.fake'),
            box;

        setupFakeItem(qFake);
        box = el('section#' + groupId + '.cat', [
            el('h1', [
                response.tags.join(', ')
            ]),
            el('h2', ['important']),
            el('ul.important', [
                response.queued.map(function(item) {
                    return addItem(item, true, itemIndex++);
                }),
                qFake
            ]),
            el('h2', ['latest']),
            el('ul.latest', [
                response.latest.map(function(item) {
                    return addItem(item, false);
                }),
                lFake
            ])
        ]);
        groups.push(el);
        insertCat(box);
    }

    function clearColumnSetup() {
        columns = [
            [], []
        ];
        columnsById = {};
    }

    function removeAllCats() {
        var cats = document.getElementsByClassName('cat'),
            copy = [],
            i, l;

        for (i = 0, l = cats.length; i < l; i++) {
            copy.push(cats[i]);
        }
        copy.forEach(function(node) {
            node.remove();
        });
        groups = [];
    }

    function clearCheckboxes() {
        var checkboxes = document.querySelectorAll('#all-tags input'),
            i;

        for (i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
    }

    function receiveCats(event) {
        var cats = event.detail.cats;

        clearColumnSetup();
        cats.forEach(function(cat, i) {
            columns[i % 2].push(cat);
            columnsById[cat] = [i % 2, Math.floor(i / 2)];
        });

        clearCheckboxes();
        removeAllCats();

        cats.forEach(function(cat) {
            var checkbox = document.getElementById('cat-select-' + cat);
            if (checkbox)
                checkbox.checked = true
            getBookmarks({ tags: [cat] });
        })
    }

    function receiveAllTags(event) {
        var current = document.getElementById('all-tags');

        var ul = el('ul#all-tags', event.detail.allTags.map(function(tag) {
            var id = 'cat-select-' + tag,
                input;
            var li = el('li', [
                input = el('input#' + id, { type: 'checkbox' }),
                el('label', { for: id }, [tag])
            ]);
            input.addEventListener('click', function() {
                var on = this.checked;
                
                if (on)
                    addCategory(tag);
                else
                    removeCategory(tag);
            });
            return li;
        }));
        current.parentElement.replaceChild(ul, current);
        getCats();
    }

    function receiveFilterTag(event) {
        var filter = event.detail.filterTag,
            filterInput = document.getElementById('filter-tag');
        if (event.detail.updated) {
            getCats();
        } else {
            filterInput.value = filter;
        }
    }

    function doRequest(request) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent("bookmark-query", true, true, request);
        document.documentElement.dispatchEvent(event);
    }

    function getAllTags() {
        doRequest({ action: 'getAllTags' });
    }

    function getCats() {
        doRequest({ action: 'getCatList' });
    }

    function getBookmarks(query) {
        doRequest({ action: 'get', query: query });
    }

    function moveItem(group, id, src, dest) {
        // TODO the src parameter is unused
        doRequest({ action: 'order', groupId: group, itemId: id, src: src, dest: dest});
    }

    function addCategory(cat) {
        doRequest({ action: 'updateCatList', cat: cat, add: true });
    }

    function removeCategory(cat) {
        doRequest({ action: 'updateCatList', cat: cat, add: false });
    }

    function getFilterTag() {
        doRequest({ action: 'getFilterTag' });
    }

    function setFilterTag(value) {
        doRequest({ action: 'setFilterTag', filterTag: value });
    }

    function setupControls() {
        var panel = document.getElementById('config'),
            stuff = document.getElementById('stuff'),
            settingsBtn = document.getElementById('btn-settings'),
            refreshBtn = document.getElementById('btn-refresh'),
            closeConfigBtn = document.getElementById('btn-close-config');

        settingsBtn.addEventListener('click', function() {
            var panelHeight = panel.clientHeight;

            if (panel.classList.contains('open')) {
                panel.classList.remove('open');
                stuff.style.transform = 'translateY(0px)';
            } else {
                panel.classList.add('open');
                stuff.style.transform = 'translateY(' + panelHeight + 'px)';
            }
        });
        closeConfigBtn.addEventListener('click', function() {
            panel.classList.remove('open');
            stuff.style.transform = 'translateY(0px)';
        });

        refreshBtn.addEventListener('click', getAllTags);
    }

    function setupFilterInput() {
        var filterInput = document.getElementById('filter-tag'),
            timer;

        filterInput.addEventListener('keyup', function() {
            var that = this;

            clearTimeout(timer);
            timer = setTimeout(function() {
                setFilterTag(that.value);
            }, 500);
        });
    }

    var groups = [];
    var columns = [
        [], []
    ];
    var columnsById = {};

    domReady(function() {
        document.documentElement.addEventListener("bookmark-response", function(event) {
            if (event.detail.tags) {
                receiveData(event);
            }
            if (event.detail.cats) {
                receiveCats(event);
            }
            if (event.detail.allTags) {
                receiveAllTags(event);
            }
            if (event.detail.filterTag !== undefined) {
                receiveFilterTag(event);
            }
        }, false);

        setupControls();
        setupFilterInput();
        getAllTags();
        getFilterTag();
    });

    window.baMoveItem = moveItem;
});

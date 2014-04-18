/**
 * Sugared DOM construction by Neil Jenkins
 * https://gist.github.com/neilj/1532562
 * http://blog.fastmail.fm/2012/02/20/building-the-new-ajax-mail-ui-part-2-better-than-templates-building-highly-dynamic-web-pages/
 *
 * Adapted as an AMD module
 * Fixed Array check
 */

define(['util'], function(util) {
    var doc = document;

    var directProperties = {
        'class': 'className',
        className: 'className',
        defaultValue: 'defaultValue',
        'for': 'htmlFor',
        html: 'innerHTML',
        text: 'textContent',
        value: 'value'
    };

    var booleanProperties = {
        checked: 1,
        defaultChecked: 1,
        disabled: 1,
        multiple: 1,
        selected: 1
    };

    var setProperty = function (el, key, value) {
        var prop = directProperties[key];
        if (prop) {
            el[prop] = (value == null ? '' : '' + value);
        } else if (booleanProperties[key]) {
            el[key] = !!value;
        } else if (value == null) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, '' + value);
        }
    };

    var appendChildren = function (el, children) {
        var i, l, node;
        for (i = 0, l = children.length; i < l; i += 1) {
            node = children[i];
            if (node) {
                // TODO
                if (util.isArray(node)) {
                    appendChildren(el, node);
                } else {
                    if (typeof node === 'string') {
                        node = doc.createTextNode(node);
                    }
                    el.appendChild(node);
                }
            }
        }
    };

    var splitter = /(#|\.)/;

    var create = function (tag, props, children) {
        if (util.isArray(props)) {
            children = props;
            props = null;
        }

        var parts, name, el,
            i, j, l, node, prop;

        if (splitter.test(tag)) {
            parts = tag.split(splitter);
            tag = parts[0];
            if (!props) { props = {}; }
            for (i = 1, j = 2, l = parts.length; j < l; i += 2, j += 2) {
                name = parts[j];
                if (parts[i] === '#') {
                    props.id = name;
                } else {
                    props.className = props.className ?
                        props.className + ' ' + name : name;
                }
            }
        }

        el = doc.createElement(tag);
        if (props) {
            for (prop in props) {
                setProperty(el, prop, props[prop]);
            }
        }
        if (children) {
            appendChildren(el, children);
        }
        return el;
    };

    return create;
});

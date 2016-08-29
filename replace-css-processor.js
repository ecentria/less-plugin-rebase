'use strict';

var reduceUrls = require('./node_modules/clean-css/lib/urls/reduce');
var path = require('path');
var url = require('url');

function isAbsolute(uri) {
    return uri[0] == '/';
}

function isSVGMarker(uri) {
    return uri[0] == '#';
}

function isEscaped(uri) {
    return uri.indexOf('__ESCAPED_URL_CLEAN_CSS__') === 0;
}

function isInternal(uri) {
    return /^\w+:\w+/.test(uri);
}

function isRemote(uri) {
    return /^[^:]+?:\/\//.test(uri) || uri.indexOf('//') === 0;
}

function isImport(uri) {
    return uri.lastIndexOf('.css') === uri.length - 4;
}

function isData(uri) {
    return uri.indexOf('data:') === 0;
}

function replaceUriPrefix(uri, options)
{
    if (typeof options.replaceFrom === 'string' && typeof options.replaceTo === 'string') {
        options.replaceFrom = [options.replaceFrom];
        options.replaceTo = [options.replaceTo];
    }
    if (!options.replaceFrom instanceof Array || !options.replaceTo instanceof Array || options.replaceFrom.length !== options.replaceTo.length) {
        return uri;
    }
    var replaceTo,
        replaceFromReg,
        length = options.replaceFrom.length,
        resolvedUri = uri;
    for (var i = 0; i < length; i++) {
        replaceTo = options.replaceTo[i];
        replaceFromReg = new RegExp(options.replaceFrom[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (replaceFromReg.test(resolvedUri)) {
            return resolvedUri.replace(replaceFromReg, replaceTo);
        }
    }
    return uri;
}

function replace(uri, options) {
    if (isAbsolute(uri) || isSVGMarker(uri) || isEscaped(uri) || isInternal(uri) || /*isImport(uri) || */isRemote(uri))
        return uri;

    if (isData(uri))
        return '\'' + uri + '\'';

    if (options.fromBase === false) {
        return replaceUriPrefix(uri, options);
    } else {
        return path.relative(options.fromBase, replaceUriPrefix(path.join(options.fromBase || '', uri), options));
    }
}

function quoteFor(url) {
    if (url.indexOf('\'') > -1)
        return '"';
    else if (url.indexOf('"') > -1)
        return '\'';
    else if (/\s/.test(url) || /[\(\)]/.test(url))
        return '\'';
    else
        return '';
}

function RebaseCssProcessor(options) {
    this.options = {
        fromBase: options.relativeTo || false,
        replaceFrom: options.replaceFrom || [],
        replaceTo: options.replaceTo || [],
        urlQuotes: options.urlQuotes || false,
        isPreProcessor: options.isPreProcessor || false
    };
    this.context = {
        warnings: []
    };
}

RebaseCssProcessor.prototype = {
    install: function (less, pluginManager) {
        if (this.options.isPreProcessor) {
            pluginManager.addPreProcessor(this);
        } else {
            pluginManager.addPostProcessor(this);
        }
    },
    process: function (css) {
        var options = this.options;
        return reduceUrls(css, this.context, function (originUrl, tempData) {
            var url = originUrl.replace(/^(url\()?\s*['"]?|['"]?\s*\)?$/g, '');
            var match = originUrl.match(/^(url\()?\s*(['"]).*?(['"])\s*\)?$/);
            var quote;
            if (!!options.urlQuotes && match && match[2] === match[3]) {
                quote = match[2];
            } else {
                quote = quoteFor(url);
            }
            tempData.push('url(' + quote + replace(url, options) + quote + ')');
        });
    },
    minVersion: [1, 0, 0]
};

module.exports = RebaseCssProcessor;
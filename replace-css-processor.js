'use strict';

var reduceUrls = require('clean-css/lib/urls/reduce');
var helpers = require('./helpers');
var path = require('path');
var url = require('url');

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
    if (helpers.isAbsolute(uri) || helpers.isSVGMarker(uri) || helpers.isEscaped(uri) || helpers.isInternal(uri) || /*helpers.isImport(uri) || */helpers.isRemote(uri))
        return uri;

    if (helpers.isData(uri))
        return '\'' + uri + '\'';

    if (options.fromBase === false) {
        return replaceUriPrefix(uri, options);
    } else {
        return path.relative(options.fromBase, replaceUriPrefix(path.join(options.fromBase || '', uri), options));
    }
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
                quote = helpers.quoteFor(url);
            }
            tempData.push('url(' + quote + replace(url, options) + quote + ')');
        });
    },
    minVersion: [1, 0, 0]
};

module.exports = RebaseCssProcessor;
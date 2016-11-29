'use strict';

var reduceUrls = require('clean-css/lib/urls/reduce');
var path = require('path');
var url = require('url');
var fs = require('fs');
var helpers = require('./helpers');

function CheckUrlCssProcessor(options) {
    this.options = {
        fromBase: options.relativeTo || false
    };
    this.context = {
        warnings: []
    };
    this.LessError = null;
}

function normolizeUrl(url) {
    return url.replace(/(?:\?[^?]*|#[^#]*)$/, '');
}

CheckUrlCssProcessor.prototype = {
    check: function (cssFilename, uri, options) {
        if (helpers.isAbsolute(uri) || helpers.isSVGMarker(uri) || helpers.isEscaped(uri) || helpers.isInternal(uri) || helpers.isImport(uri) || helpers.isRemote(uri))
            return uri;

        if (helpers.isData(uri))
            return '\'' + uri + '\'';

        var filePath = path.join(options.root || '', path.dirname(cssFilename), normolizeUrl(uri)),
            exits = false;
        try {
            var stats = fs.statSync(filePath);
            exits = stats.isFile();
        } catch (e) {
            exits = false;
        }
        if (!exits) {
            this.context.warnings.push('Incorrect asset url (' + uri + ')');
        }
    },
    install: function (less, pluginManager) {
        pluginManager.addPostProcessor(this);
        this.LessError = less.LessError;
    },
    process: function (css, settings) {
        var me = this, options = this.options, cssFilename = settings.options.filename;
        this.context.warnings = [];
        var result = reduceUrls(css, this.context, function (originUrl, tempData) {
            var url = originUrl.replace(/^(url\()?\s*['"]?|['"]?\s*\)?$/g, '');
            var match = originUrl.match(/^(url\()?\s*(['"]).*?(['"])\s*\)?$/);
            var quote;
            if (match && match[2] === match[3]) {
                quote = match[2];
            } else {
                quote = helpers.quoteFor(url);
            }
            // ignore @imports, because it was already checked by Less compiler
            if (!/@import[ a-z\(\)]+$/.test(tempData[tempData.length - 1])) {
                me.check(cssFilename, url, options);
            }
            tempData.push('url(' + quote + url + quote + ')');
        });
        if (this.context.warnings.length) {
            throw new this.LessError({
                type: 'Parse',
                message: this.context.warnings.join("\n"),
                filename: cssFilename
            });
        }
        return result;
    },
    minVersion: [1, 0, 0]
};

module.exports = CheckUrlCssProcessor;
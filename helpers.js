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

module.exports = {
    isAbsolute : isAbsolute,
    isSVGMarker : isSVGMarker,
    isEscaped : isEscaped,
    isInternal : isInternal,
    isRemote : isRemote,
    isImport : isImport,
    isData : isData,
    quoteFor : quoteFor
};
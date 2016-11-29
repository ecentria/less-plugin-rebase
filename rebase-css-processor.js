var rebaseUrls = require('clean-css/lib/urls/rebase');

function RebaseCssProcessor(options) {
    this.context = {
        warnings: [],
        options: {
            explicitRoot: !!options.root,
            explicitTarget: !!options.target,
            relativeTo: options.relativeTo,
            root: options.root || process.cwd(),
            target: options.target
        }
    };
};

RebaseCssProcessor.prototype = {
    process: function (css, extra) {
        return rebaseUrls(css, this.context);
    }
};

module.exports = RebaseCssProcessor;

var rebaseUrls = require('./node_modules/clean-css/lib/urls/rebase');

function RebaseLessProcessor(options) {
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

RebaseLessProcessor.prototype = {
    process: function (css, extra) {
        return rebaseUrls(css, this.context);
    }
};

module.exports = RebaseLessProcessor;
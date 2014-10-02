var path = require('path');
var fs = require('fs');

var through = require('through2');
var gutil = require('gulp-util');

module.exports = function(options) {
    options = options || {};
    var mapping = options.mapping || [];
    var urlPrefix = options.urlPrefix || '';

    var basePath, mainPath, mainName, alternatePath, extName, pathName;

    var _defaultPatterns = {
        html: [
            [
                /<script.+src=['"]([^"']+)["'].+>/gm,
                'Update the HTML script tag to reference concat files'
            ],
            [
                /<link[^\>]+href=['"]([^"']+)["']/gm,
                'Update the HTML link css tag to reference concat files'
            ]
        ]
    };

    function defaultInHandler(m) {
        return m;
    };

    function defaultOutHandler(replaceFile, srcFile, tag) {
        if (srcFile.indexOf('://') >= 0) {
            return tag;
        }
        var rs = '';
        replaceFile.forEach(function(item) {
            rs += tag.replace(srcFile, path.normalize(urlPrefix + item)) + '\r\n';
        });
        return rs;
    };

    function concatFinder(srcFile) {
        var include = [];
        for (var i = 0; i < mapping.length; i++) {
            if (srcFile == mapping[i].target) {
                include = mapping[i].include;
                break;
            }
        }
        return include;
    };

    function createFile(name, content) {
        return new gutil.File({
            path: path.join(path.relative(basePath, mainPath), name),
            contents: new Buffer(content)
        });
    };

    function processHandler(content) {
        if (mapping.length == 0) {
            return content;
        }

        var regexps = _defaultPatterns;
        var log = function() {};

        regexps['html'].forEach(function(rxl) {
            var filterIn = rxl[2] || defaultInHandler;
            var filterOut = rxl[3] || defaultOutHandler;

            content = content.replace(rxl[0], function(match, src) {
                var srcFile = filterIn(src);
                log('looking for concat inline file of ' + src);

                var include = concatFinder(srcFile.split('?')[0]);
                var res = match;
                if (include.length == 0) {
                    log('no concat version of ' + src + ' found!');
                } else {
                    log('replace "' + src + '" to "' + include.join(',') + '"');
                }
                res = filterOut(include, src, match);
                return res;
            });
        });

        return content;
    };

    function processHtml(content, push, callback) {
        gutil.log('jsrefs: process file ' + mainName);

        var result = processHandler(content);

        var file = createFile(mainName, result);
        push(file);
        callback();
    };

    return through.obj(function(file, enc, callback) {
        if (file.isNull()) {
            this.push(file); // Do nothing if no contents
            callback();
        } else if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-jsrefs', 'Streams are not supported!'));
            callback();
        } else {
            basePath = file.base;
            mainPath = path.dirname(file.path);
            mainName = path.basename(file.path);
            extName = path.extname(file.path);
            pathName = file.path;

            processHtml(String(file.contents), this.push.bind(this), callback);
        }
    });
};

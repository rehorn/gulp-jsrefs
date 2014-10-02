gulp-jsrefs
===========

js debug/develop refs replacement plugin for gulp.

#### usage
```
var dist = './dist';
// replace html js contact to seprate script inline for debug/develop
gulp.task('jsrefs', function() {
    var refOpt = {
        urlPrefix: '../',
        mapping: [{
            target: 'js/concat.js',
            inclue: [{
                'src/js/common.js',
                'src/js/index.js',
            }]
        }]
    };

    return gulp.src(dist + '*.html')
        .pipe(jsrefs(refOpt))
        .pipe(gulp.dest(dist));
});
```

#### src/index.html
```
<html>
<script type="text/javascript" src="js/tab.js"></script>
</html>
```

### after gulp, dist/index.html, for debug & develop purpose
```
<html>
<script type="text/javascript" src="../src/js/common.js"></script>
<script type="text/javascript" src="../src/js/index.js"></script>
</html>
```
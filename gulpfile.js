/***
 * @author nolest 2019-1-30
 * @description 该文件用于编译配置，包括以下任务，可按顺序执行：
 * gulp sass 从WebContentSrc文件夹抽取所有scss文件，编译到WebContentDist下
 * gulp js 从WebContentSrc文件夹抽取所有js文件，编译到WebContentDist下
 * gulp inject 从WebContentSrc文件夹抽取所有jsp文件，注入同名的css js文件
 * gulp jspMove 从WebContentSrc文件夹复制所有jsp文件，编译到WebContentDist下
 * gulp clean 清除WebContentDist所有文件，包括本身
 * gulp moveOther 移动出去jsp外的所有文件到WebContentDist
 * gulp begin 整合初始化任务，一条命令完成初始化
 * gulp dev 开启监听模式，监听WebContentSrc文件夹的sass和js文件变动，输出到WebContentDist下
 * 在目标文件夹WebContentDist/resources/pages/下会生成对应层级的目录
 */

//配置文件
//var config = require('./gulp.env.js');
var gulp = require('gulp');
var inject = require('gulp-inject');
var sass = require('gulp-sass');
var debug = require('gulp-debug');
var using = require('gulp-using');
var glob = require('glob');
var path = require('path');
var rename = require("gulp-rename");
var clean = require('gulp-clean');

//源码文件夹名
var srcRootName = 'WebContentSrc';
//目标文件夹名
var distRootName = 'WebContent';
//整体源码目录
var srcRoot = './' + srcRootName + '/';
//整体目标目录
var distRoot = './' + distRootName + '/';
//资源源码目录
var srcDir = './' + srcRootName + '/WEB-INF/';
//资源目标目录
var distDir = './' + distRootName + '/resources/pages/';
//jsp文件目录
var jspDistDir = './' + distRootName + '/WEB-INF/jsp';

//获取文件名
function getName(file) {
    return path.win32.basename(file.path).slice(0, -path.extname(file.path).length);
}
//每个文件的注入操作
var myTransform = (filepath, file, i, len, target) => {
    if (getName(file) === getName(target)) {
        var timeStr = new Date().getTime();
        var dirname = path.win32.dirname(file.path);
        let pageSolve = dirname.substring(dirname.indexOf('pages') + 'pages/'.length, dirname.length);
        if (path.extname(file.path) == '.css') {
            return '<link href=\'<c:url value=\"/resources/pages/' + pageSolve + '/' + path.win32.basename(file.path) + '?v=' + timeStr + '"\/>\' rel="stylesheet">'
        }
        else if (path.extname(file.path) == '.js') {
            return '<script src=\'<c:url value=\"/resources/pages/' + pageSolve + '/' + path.win32.basename(file.path) + '?v=' + timeStr + '"\/>\' type="text/javascript"></script>'
        }
    }
};
//开发模式单个文件的注入操作
var singleTransform = (filepath, file, i, len, target) => {
    var timeStr = new Date().getTime();
    var dirname = path.win32.dirname(file.path);
    let pageSolve = dirname.substring(dirname.indexOf('pages') + 'pages/'.length, dirname.length);
    console.log(path.extname(file.path))
    if (path.extname(file.path) == '.css') {
        return '<link href=\'<c:url value=\"/resources/pages/' + pageSolve + '/' + path.win32.basename(file.path) + '?v=' + timeStr + '"\/>\' rel="stylesheet">'
    }
    else if (path.extname(file.path) == '.js') {
        return '<script src=\'<c:url value=\"/resources/pages/' + pageSolve + '/' + path.win32.basename(file.path) + '?v=' + timeStr + '"\/>\' type="text/javascript"></script>'
    }
};

var converSrcPath = (srcPath) => {
    return srcPath.replace(srcRootName, distRootName)
}
//编译sass文件
gulp.task('sass', () => {
    return gulp.src(srcDir + 'jsp/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(rename({ extname: ".css" }))
        .pipe(gulp.dest(distDir))
})
//编译js文件
gulp.task('js', () => {
    return gulp.src(srcDir + 'jsp/**/*.js')
        .pipe(gulp.dest(distDir))
})
//资源注射
gulp.task('inject', () => {
    return gulp.src(srcDir + 'jsp/**/*.jsp')
        .pipe(inject(
            gulp.src([distDir + '**/*.css', distDir + '**/*.js'], { read: false }),
            {
                starttag: '<!-- inject:{{ext}} -->',
                relative: true,
                transform: myTransform
            }))
        .pipe(gulp.dest(jspDistDir))
})
//scss js jsp以外的全部移动
gulp.task('moveOther', () => {
    return gulp.src([srcRoot + '**/*.*', '!' + srcDir + 'jsp/**/*.scss', '!' + srcDir + 'jsp/**/*.js', '!' + srcDir + 'jsp/**/*.jsp'])
        .pipe(gulp.dest(distRoot))
})
//jsp生成
gulp.task('jspMove', () => {
    return gulp.src(srcDir + 'jsp/**/*.jsp')
        .pipe(gulp.dest(jspDistDir))
})
//首次执行
gulp.task('begin', gulp.series(['moveOther', 'jspMove', 'sass', 'js', 'inject']), () => {
    console.log('init done')
})
//清理所有目标文件夹
gulp.task('clean', () => {
    return gulp.src([distRoot])
        .pipe(clean())
})
//模板插入注射节点
gulp.task('injectPoint', () => {
    return gulp.src(srcDir + 'jsp/**/*.jsp')
        .pipe(replace('<%@include file="/WEB-INF/jsp/common/jspInit.jsp" %>'), '<% @include file="/WEB-INF/jsp/common/jspInit.jsp" %>')
})
//开发监听模式
gulp.task('dev', () => {
    const watcher = gulp.watch(srcDir + '**/*.jsp');
    watcher.on('change', function (pathstr, stats) {
        console.log('Change File:', pathstr)
        //var a = pathstr.replace(srcRootName,'');
        //console.log('re',a)
        //资源注射，重定位文件
        //console.log('target:',converSrcPath(path.win32.dirname(pathstr)))
        return gulp.src(pathstr)
            .pipe(inject(
                gulp.src([distDir + '**/*.css', distDir + '**/*.js'], { read: false }),
                {
                    starttag: '<!-- inject:{{ext}} -->',
                    relative: true,
                    transform: singleTransform
                }))
            .pipe(rename(pathstr.replace(srcRootName, '')))
            .pipe(gulp.dest(distRootName))
    })
    //gulp.watch(srcDir + '**/*.jsp', gulp.series('jspMove'));
    gulp.watch(srcDir + '**/*.scss', gulp.series('sass'));
    gulp.watch(srcDir + '**/*.js', gulp.series('js'));
})
//发布生产模式
gulp.task('prod', () => {

})

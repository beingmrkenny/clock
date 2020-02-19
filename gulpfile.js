const { src, dest, series, parallel, watch } = require('gulp');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs-extra');
const closureCompiler = require('google-closure-compiler').gulp();
const sass = require('gulp-sass');
const replace = require('gulp-replace');

function css (release=false) {

	sass.compiler = require('node-sass');

	var options = {
		outputStyle : 'expanded',
		cache : '/tmp/sass-cache'
	};

	if (release) {
		return src('sass/init.scss')
			.pipe(sass().on('error', sass.logError))
			.pipe(rename('clock.css'))
			.pipe(dest('serve/'));
	} else {
		return src('sass/init.scss')
			.pipe(sourcemaps.init())
			.pipe(sass().on('error', sass.logError))
			.pipe(rename('clock.css'))
			.pipe(sourcemaps.write('.'))
			.pipe(dest('serve/'));
	}
}

function js (release=false) {

	var globs = [
		"commun/js/thirdparty/mousetrap.js",
		"commun/js/thirdparty/suncalc.js",
		"commun/js/classes/LocalStorage.js",
		"commun/js/classes/GlobalVariables.js",
		"commun/js/includes/dom.js",
		"commun/js/includes/html.js",
		"commun/js/includes/javascript.js",
		"commun/js/includes/numbers.js",
		"commun/js/includes/object.js",
		"js/*.js",
	];

	var options = {
		// compilation_level: 'ADVANCED_OPTIMIZATIONS',
		warning_level: 'QUIET',
		language_in: 'ECMASCRIPT6_STRICT',
		language_out: 'ECMASCRIPT5_STRICT',
		js_output_file: 'clock.js',
		create_source_map: 'js.map',
		externs: 'externs.js'
	};

	fs.copySync('commun/js/classes/Dative.js', 'serve/Dative.js');

	if (release) {
		return src(globs)
			.pipe(closureCompiler(options))
			.pipe(dest('serve/'));
	} else {
		return src(globs)
			.pipe(sourcemaps.init())
			.pipe(closureCompiler(options))
			.pipe(sourcemaps.write('.'))
			.pipe(dest('serve/'));
	}

}

function html() {
	var Dative = require('./commun/js/classes/Dative');
	fs.copySync('html/index.html', 'serve/index.html');
	var release = (new Dative()).toString('YmdHis');
	return src('serve/index.html')
		.pipe(replace('refresh=refresh', `refresh=${release}`))
		.pipe(dest('serve/'));
}

function cleanup (cb) {
	fs.removeSync('package-lock.json');
	fs.removeSync('serve');
	cb();
}

// FIXME: Duplication of local and readme for one parameter change is poo poo

function local (cb) {
	css();
	js();
	fs.copySync('assets/favicon.ico', 'serve/favicon.ico');
	fs.copySync('assets/favicon.png', 'serve/favicon.png');
	fs.copySync('assets/moon.png', 'serve/moon.png');
	html();
	if (typeof cb == 'function') {
		cb();
	}
}

function release (cb) {
	css(true);
	js(true);
	fs.copySync('assets/favicon.ico', 'serve/favicon.ico');
	fs.copySync('assets/favicon.png', 'serve/favicon.png');
	fs.copySync('assets/moon.png', 'serve/moon.png');
	html();
	// TODO: delete the htdocs/clock dir
	// TODO: copy serve directory to htdocs/clock
	cb();
}

function watchCommand (cb) {
	const notify = require('node-notify');
	local();
	watch(['commun/js/**/*.js', 'js/*.js', 'sass/*.scss', 'html/index.html'], function(cb) {
		local();
		notify('Done');
		cb();
	});
}

function open (cb) {
	const shell = require('gulp-shell');
	return src('.', {read: false})
		.pipe(shell(['open serve/index.html']));
}

exports.open = open;
exports.serve = open;

exports.css = css;
exports.js = js;
exports.html = html;
exports.release = series(cleanup, release);
exports.local = series(cleanup, local);
exports.default = series(cleanup, local);
exports.watch = series(local, watchCommand);

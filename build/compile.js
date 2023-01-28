const fs = require('fs-extra');
const ClosureCompiler = require('google-closure-compiler').compiler;

exports.compileJS = () => {

    const globs = [
        "commun/js/thirdparty/mousetrap.js",
        "commun/js/thirdparty/suncalc.js",
        "commun/js/classes/LocalStorage.js",
        "commun/js/classes/GlobalVariables.js",
        "commun/js/includes/dom.js",
        "commun/js/includes/html.js",
        "commun/js/includes/javascript.js",
        "commun/js/includes/numbers.js",
        "commun/js/includes/strings.js",
        "commun/js/includes/object.js",
        "js/*.js",
    ];

    fs.copySync('commun/js/classes/Dative.js', 'serve/Dative.js');

    const closureCompiler = new ClosureCompiler({
        compilation_level: 'ADVANCED',
        js: globs,
        warning_level: 'QUIET',
        language_in: 'ECMASCRIPT6_STRICT',
        language_out: 'ECMASCRIPT5_STRICT',
        js_output_file: 'serve/clock.js',
        create_source_map: 'serve/clock.js.map',
        externs: 'build/externs.js'
    });

    // TODO: shove the fackin sourcemap link on the end of clock.js

    const compilerProcess = closureCompiler.run((exitCode, stdOut, stdErr) => {
        console.log(exitCode);
        console.log(stdOut);
        console.log(stdErr);
    });
}

exports.compileJS();
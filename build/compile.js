const fs = require('fs-extra');
const ClosureCompiler = require('google-closure-compiler').compiler;
const exec = require('child_process').execSync;

exports.compileJS = () => {

    const globs = [
        "commun/js/thirdparty/mousetrap.js",
        "commun/js/thirdparty/suncalc.js",
        "commun/js/classes/LocalStorage.js",
        "commun/js/classes/GlobalVariables.js",
        "commun/js/includes/dom.js",
        "commun/js/classes/Dative.js",
        "js/*.js",
    ];

    const closureCompiler = new ClosureCompiler({
        js: globs,
        warning_level: 'QUIET',
        js_output_file: 'serve/clock.js',
        create_source_map: 'serve/clock.js.map'
    });

    closureCompiler.run((exitCode, stdOut, stdErr) => {
        console.log(exitCode);
        console.log(stdOut);
        console.log(stdErr);
        fs.appendFileSync('serve/clock.js', '//# sourceMappingURL=clock.js.map');
        const sourcemap = JSON.parse(fs.readFileSync('serve/clock.js.map'));
        sourcemap.sources.forEach((item, i) => sourcemap.sources[i] = `../${item}`);
        fs.writeFileSync('serve/clock.js.map', JSON.stringify(sourcemap));
        exec('say sh');
    });

}

// TODO change this so it only runs if the script is called from node, not if it's compiled
exports.compileJS();
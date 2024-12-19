const { compileJS } = require("./compile");
const exec = require('child_process').execSync;
const fs = require('fs-extra');

fs.emptyDirSync('./serve/');

fs.copySync('assets/favicon.ico', 'serve/favicon.ico');
fs.copySync('assets/favicon.png', 'serve/favicon.png');
fs.copySync('assets/moon.png', 'serve/moon.png');

// compileJS(); // FIXME does this need to be called?
exec('echo hello');
exec('cp html/index.html serve/index.html && sed -i \'\' -e \"s/?refresh=refresh/?refresh=$(date \'+%Y%m%d%H%M%S\')/g\" serve/index.html');
exec('sass sass/init.scss serve/clock.css');
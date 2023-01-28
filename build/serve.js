const { compileJS } = require("./compile");
const { compileHTML } = require("./html");
const exec = require('child_process').execSync;
const fs = require('fs-extra');

fs.emptyDirSync('./serve/');

fs.copySync('assets/favicon.ico', 'serve/favicon.ico');
fs.copySync('assets/favicon.png', 'serve/favicon.png');
fs.copySync('assets/moon.png', 'serve/moon.png');

compileJS();
compileHTML();
exec('sass sass/init.scss serve/clock.css');
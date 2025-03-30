const { compileJS } = require("./compile");
const exec = require('child_process').execSync;
const fs = require('fs-extra');

// NOTE unifinished, because it was taking as long as serve to do something less useful

fs.emptyDirSync('./dev/');

fs.copySync('assets/favicon.ico', 'dev/favicon.ico');
fs.copySync('assets/favicon.png', 'dev/favicon.png');
fs.copySync('assets/moon.png', 'dev/moon.png');
fs.copySync('js/', 'dev/');

[
	'commun/js/thirdparty/mousetrap.js',
	'commun/js/thirdparty/suncalc.js',
	'commun/js/thirdparty/Astro.js',
	'commun/js/classes/LocalStorage.js',
	'commun/js/classes/GlobalVariables.js',
	'commun/js/includes/dom.js',
	'commun/js/classes/Dative.js',
].forEach(file => {
	fs.copySync(file, 'dev/'+file.split('/').pop());
});

// read all js files that aren't init
// insert them ala <script type="text/javascript" src="./clock.js?refresh=refresh"></script>
// put them before this line
// then replace this line with the init
//<script type="text/javascript" src="./clock.js?refresh=refresh"></script>

fs.readdirSync('dev').forEach((file) => {
	if (file.endsWith('.js')) {
		let filename = file.split('/').pop();
		if (filename != 'init.js') {
			console.log(
				`<script type="text/javascript" src="./${filename}"></script>`
			);
		}
	}
});


fs.copySync('html/index.html', 'dev/index.html');
// exec('sass sass/init.scss serve/clock.css');
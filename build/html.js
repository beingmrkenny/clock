const Dative = require('../commun/js/classes/Dative');
const replace = require('replace-in-file');
const fs = require('fs-extra');

exports.compileHTML = () => {

    fs.copySync('html/index.html', 'serve/index.html');

    try {
        const results = replace.sync({
            files: 'serve/index.html',
            from: 'refresh=refresh',
            to: `refresh=${(new Dative()).toString('YmdHis')}`,
        });
        console.log('Replacement results:', results);
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

exports.compileHTML();
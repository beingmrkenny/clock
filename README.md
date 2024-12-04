# Clock

You'll need a Java Runtime (`brew install java`).

Make a symlink to commun (https://github.com/beingmrkenny.co.uk/commun) (`ln -s ../commun`).

`npm run css`
`npm run js`
`npm run html`

`npm run serve` - create the serve directory (ready to release, or to run locally)
`npm run watch` - runs serve, then watches all source files and compiles as necessary

If you want to run it from a petite server, make sure http-serve is installed (`npm i -g http-server`), then run `http-server ./serve/` from the root dir of the repo. Make sure you've run serve, or are watching the files.
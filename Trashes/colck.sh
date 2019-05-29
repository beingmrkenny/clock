function colr () {
	local refreshDate=`date '+%Y%m%d%H%M%S'`;
	mkdir -p /Users/beingmrkenny/iCloud/htdocs/clock/assets;
	colc release;
	colj release;

	cp /git/clock/favicon.ico /Users/beingmrkenny/iCloud/htdocs/clock/favicon.ico;
	cp /git/clock/favicon.png /Users/beingmrkenny/iCloud/htdocs/clock/favicon.png;
	cp /git/clock/moon.png /Users/beingmrkenny/iCloud/htdocs/clock/moon.png;

	if [[ -f /Users/beingmrkenny/htdocs/clock/assets/clock.map ]]; then
		rm /Users/beingmrkenny/htdocs/clock/assets/clock.map;
	fi

	if [[ -f /Users/beingmrkenny/htdocs/clock/assets/clock.css.map ]]; then
		rm /Users/beingmrkenny/htdocs/clock/assets/clock.css.map;
	fi

	sed 's@/assets/@assets/@g' /git/clock/index.html > /Users/beingmrkenny/iCloud/htdocs/clock/index.html;
	echo $(sed 's@/commun/js/classes/@assets/@g' /Users/beingmrkenny/iCloud/htdocs/clock/index.html) > /Users/beingmrkenny/iCloud/htdocs/clock/index.html;
	echo $(sed "s@refresh=refresh@refresh=$refreshDate@g" /Users/beingmrkenny/iCloud/htdocs/clock/index.html) > /Users/beingmrkenny/iCloud/htdocs/clock/index.html;
}

function colc () {

	local watch='--watch';
	local release=false;

	for arg; do
		if [[ "$arg" == 'now' ]]; then
			watch='';
		fi
		if [[ "$arg" == 'release' ]]; then
			release=true;
			watch='';
		fi
	done

	# local outputRoot="/Users/beingmrkenny/iCloud/htdocs/assets";
	local root="/git/clock";
	local input="$root/sass/init.scss";
	local output="/Users/beingmrkenny/iCloud/htdocs/clock/assets/clock.css";

	if [[ $watch != '' ]]; then
		cd $root;
	fi

	local sourceMap='auto';
	if [[ $release == true ]]; then
		sourceMap='none';
	fi

	scss "$input":"$output" $watch --style=compressed --sourcemap=$sourceMap --load-path="$root/sass" --cache=/tmp/sass-cache;
	if [[ "$?" == 0 ]]; then
		color "css done" green;
	else
		color "css broke" red;
	fi

}

function colf () {
	java -jar /Users/beingmrkenny/_overflow/java/closure-compiler.jar $1 --js_output_file $2 --create_source_map $3 --warning_level DEFAULT --compilation_level WHITESPACE_ONLY
	echo "//# sourceMappingURL=$3" >> $2;
}

function colj () {

	local release=false;
	local watch=true;

	for arg; do
		if [[ "$arg" == 'now' ]]; then
			watch=false;
		fi
		if [[ "$arg" == 'release' ]]; then
			release=true;
			watch=false;
		fi
	done

	# local outputRoot="/Users/beingmrkenny/iCloud/htdocs/assets";
	local outputRoot="/Users/beingmrkenny/iCloud/htdocs/clock/assets/";
	local root="/git/clock";
	local input="$root/js";
	local output="$outputRoot/clock.js";
	local mapfile='';
	if [[ $release == false ]]; then
		mapfile="$outputRoot/clock.map";
	fi

	if [[ ! -d $outputRoot ]]; then
		mkdir $outputRoot;
	fi

	local allfiles=$(find -L $input -name '*.js' | sort -f -r);

	spit "$allfiles";

	local thirdParty=$(getClockIncludeFiles thirdparty $root);
	local classes=$(getClockIncludeFiles classes $root);
	local includes=$(getClockIncludeFiles includes $root);

	allfiles="$thirdParty $classes $includes $allfiles";

	local inputParameter="--js $allfiles";
	local inputParameter=$(echo "$inputParameter"|tr '\n' ' ');

	local mapfileString='';
	if [[ ! -z $mapfile ]]; then
		mapfileString="--create_source_map $mapfile";
	fi

	if [[ $watch == true ]]; then
		colj now;
		fswatch -0 "$input" | xargs -0 -n1 -I {} /git/clock/sh/compileClockJs.sh {};
	fi

	# go over each as-is file
	# copy it to the assets dir

	copyAsIsFiles $outputRoot;

	java -jar /Users/beingmrkenny/_overflow/java/closure-compiler.jar $inputParameter --js_output_file $output $mapfileString --warning_level DEFAULT --language_in ECMASCRIPT6_STRICT --language_out ECMASCRIPT5_STRICT;
	local result=$?;

	if [[ $result == 0 ]]; then
		# Reset the internal file to the right path
		# /Users/beingmrkenny/iCloud/htdocs
		# echo $(sed -E -e 's@/Users/beingmrkenny/iCloud/htdocs/assets@@g' "$mapfile") > "$mapfile";
		if [[ ! -z $mapfile ]]; then
			echo $(sed -E -e 's/\/Users\/mkenny\/iCloud\/htdocs//g' "$mapfile") > "$mapfile";
			echo "//# sourceMappingURL=/clock/assets/clock.map" >> $output;
		fi
		color "js done" green;
		notify "js 🤖";
		printf "\n";
	else
		color "There was an error ($result)" red;
		notify "js 👺";
	fi
}

function copyAsIsFiles () {
	local outputRoot=$1;
	local includesList="$root/sh/includesList.json";
	local fileList=$(jq .asis $includesList);
	local fileListLength=$(jq ".asis | length" $includesList);
	local files='';

	for (( i = 0; i < fileListLength; i++ )); do
		local file=$(jq ".asis[$i]" "$includesList");
		file=$(unquote "$file");
		file="/git/commun/js/$file";
		cp $file $outputRoot;
	done
}

function getClockIncludeFiles () {
	local key=$1;
	local root=$2;

	# local root="/Users/beingmrkenny/iCloud/htdocs/clock";
	local includesList="$root/sh/includesList.json";

	local files='';

	local keyRoot="/git/commun/js/$key";
	local fileList=$(jq .$key $includesList);
	# echo "jq .$key $includesList" >> ~/Desktop/files.txt;
	local fileListLength=$(jq ".$key | length" $includesList);

	for (( i = 0; i < fileListLength; i++ )); do
		local file=$(jq ".$key[$i]" "$includesList");
		file=$(unquote "$file");
		files="$files $keyRoot/$file";
	done

	echo $files;
}

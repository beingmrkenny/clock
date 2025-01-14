function placeDot(x, y, parentElement = qid('ClockSVG')) {
	parentElement.appendChild(
		createElement(
			`<circle fill="red" r="1" cx="${x}" cy="${y}">`,
			'svg'
		)
	);
}

function placeDotFancy() {
	var cx = 0,
		cy = 0,
		angle,
		parentElement = qid('ClockSVG'),
		color = 'red',
		day;

	for (let arg of arguments) {
		if (
			arg.__proto__.constructor.name == 'Date' ||
			arg.__proto__.constructor.name == 'Dative'
		) {
			angle = Time.asClockAngle(arg);
			day = new Dative(arg).toString('d');
		}
		if (arg instanceof SVGElement) {
			parentElement = arg;
		}
		if (typeof arg == 'string') {
			color = arg;
		}
	}

	if (angle) {
		let coords = polarToRect(1.1 * new Clock().radius, angle);
		cx = coords.x;
		cy = coords.y;

		parentElement.appendChild(
			createElement(
				`<circle fill="${color}" r="3" cx="${cx}" cy="${cy}">`,
				'svg'
			)
		);

		if (day) {
			let coords = polarToRect(1.3 * new Clock().radius, angle);
			parentElement.appendChild(
				createElement(
					`<text fill="${color}" x="${coords.x}" y="${coords.y}">${day}</text>`,
					'svg'
				)
			);
		}
	}
}

var counter = 0;
function placeArc() {
	var parentElement = qid('ClockSVG'),
		color = 'red',
		day,
		labelAngle;

	var start, finish;

	for (let arg of arguments) {
		if (
			arg.__proto__.constructor.name == 'Date' ||
			arg.__proto__.constructor.name == 'Dative'
		) {
			if (start) {
				finish = arg;
			} else {
				start = arg;
			}
		}
		if (arg instanceof SVGElement) {
			parentElement = arg;
		}
		if (typeof arg == 'string') {
			color = arg;
		}
	}

	counter++;

	let radius = (1 + counter / 10) * new Clock().radius,
		startAngle = Time.asClockAngle(start),
		startCoords = polarToRect(radius, startAngle),
		finishCoords = polarToRect(radius, Time.asClockAngle(finish));

	let d = `
		M ${startCoords.x},${startCoords.y}
		A ${radius},${radius} 0 0 1 ${finishCoords.x},${finishCoords.y}`;

	var day = new Dative(start).toString('d');

	if (day) {
		let coords = polarToRect(1.3 * new Clock().radius, startAngle);
		parentElement.appendChild(
			createElement(
				`<text fill="${color}" x="${coords.x}" y="${coords.y}">${day}</text>`,
				'svg'
			)
		);
	}

	parentElement.appendChild(
		createElement(
			`<path stroke="${color}" stroke-width="2" fill="none" d="${d}">`,
			'svg'
		)
	);
}

function placeLine(x1, y1, x2, y2) {
	qid('DaylightHoursSVG').appendChild(
		createElement(
			`<line stroke="red" stroke-width="1" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`,
			'svg'
		)
	);
}

function dump(which) {
	var skyEvents = new SkyEvents(),
		clock = new Clock(),
		sunTimes = skyEvents.getCurrentSun(),
		moonTimes = skyEvents.getCurrentMoon();

	if (!which || which == 'sun') {
		var sunSorter = [];
		for (let eventName in sunTimes) {
			sunSorter.push([eventName, new Dative(sunTimes[eventName])]);
		}
		sunSorter.push([
			'refresh',
			new Dative(clock.globalVariables.getItem('refreshSun')),
		]);
		sunSorter.sort(function (a, b) {
			return a[1] - b[1];
		});
		sunTimes = {};
		for (let sunArray of sunSorter) {
			sunTimes[sunArray[0]] = sunArray[1].toString('D j F, H:i:s P');
		}
		console.log('\nSun');
		console.table(sunTimes);
	}

	if (!which || which == 'moon') {
		delete moonTimes.time;
		var moonSorter = [];
		for (let eventName in moonTimes) {
			if (['rise', 'set', 'noon', 'refresh'].indexOf(eventName) > -1) {
				moonSorter.push([eventName, new Dative(moonTimes[eventName])]);
			}
		}
		moonSorter.push([
			'refresh',
			new Dative(clock.globalVariables.getItem('refreshMoon')),
		]);
		moonSorter.sort(function (a, b) {
			return a[1] - b[1];
		});
		moonTimes = {};
		for (let moonArray of moonSorter) {
			moonTimes[moonArray[0]] = moonArray[1].toString('D j F, H:i:s P');
		}
		console.log('\nMoon');
		console.table(moonTimes);
	}

	console.log('');

	return 'fin';
}

function dumple() {
	var storedData = JSON.parse(window.localStorage.getItem('MOON')).moonTimes,
		moonTimes = storedData.data;
	if (moonTimes) {
		let table = [];
		for (let collection of moonTimes) {
			let row = {};
			for (let eventName in collection) {
				if (['rise', 'set', 'noon', 'refresh'].indexOf(eventName) > -1) {
					row[eventName] = new Dative(collection[eventName]).toString(
						'd-M, H:i:s'
					);
				}
			}
			table.push(row);
		}
		console.table(table);
		console.table({
			Expires: new Dative(storedData.expirationDate).toString('j F Y, H:i:s'),
		});
	}
}

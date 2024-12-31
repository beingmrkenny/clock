// TODO test this independently

class SkyEvents {
	constructor() {
		const clock = new Clock();

		this.now = clock.now();
		this.location = clock.data.getItem('location');

		if (this.location) {
			this.sun = SunCalc.getSunTimes(
				new Dative(this.now),
				this.location.latitude,
				this.location.longitude
			);

			for (const eventName in this.sun) {
				this.sun[eventName] = new Date(this.sun[eventName].value);
			}
		}
	}

	getCurrentSun() {
		const astroDawn = this.sun.astronomicalDawn,
			nauticalDawn = this.sun.nauticalDawn,
			civilDawn = this.sun.civilDawn,
			sunrise = this.sun.sunriseStart,
			sunset = this.sun.sunsetEnd,
			civilDusk = this.sun.sunsetEnd,
			nauticalDusk = this.sun.civilDusk,
			astroDusk = this.sun.nauticalDusk,
			night = this.sun.astronomicalDusk;

		// NOTE this corrects for DST by adding the timezone offset
		return {
			astroDawn: new Date(
				astroDawn.getTime() + astroDawn.getTimezoneOffset() * 60 * 1000
			),
			nauticalDawn: new Date(
				nauticalDawn.getTime() + nauticalDawn.getTimezoneOffset() * 60 * 1000
			),
			civilDawn: new Date(
				civilDawn.getTime() + civilDawn.getTimezoneOffset() * 60 * 1000
			),
			rise: new Date(
				sunrise.getTime() + sunrise.getTimezoneOffset() * 60 * 1000
			),
			set: new Date(sunset.getTime() + sunset.getTimezoneOffset() * 60 * 1000),
			civilDusk: new Date(
				civilDusk.getTime() + civilDusk.getTimezoneOffset() * 60 * 1000
			),
			nauticalDusk: new Date(
				nauticalDusk.getTime() + nauticalDusk.getTimezoneOffset() * 60 * 1000
			),
			astroDusk: new Date(
				astroDusk.getTime() + astroDusk.getTimezoneOffset() * 60 * 1000
			),
			night: new Date(night.getTime() + night.getTimezoneOffset() * 60 * 1000),
			noon: this.sun.solarNoon,
		};
	}

	getCurrentMoon() {
		const today = SunCalc.getMoonTimes(
			new Dative(this.now),
			this.location.latitude,
			this.location.longitude
		);

		let rise, set;

		if (today.rise.getDate() == today.set.getDate()) {
			if (today.rise < today.set) {
				rise = today.rise;
				set = today.set;
			} else if (today.rise > today.set) {
				const tomorrow = SunCalc.getMoonTimes(
					new Dative(this.now).addDays(1),
					this.location.latitude,
					this.location.longitude
				);
				rise = today.rise;
				set = tomorrow.set;
			}
		} else if (today.rise.getDate() > today.set.getDate()) {
			const yesterday = SunCalc.getMoonTimes(
				new Dative(this.now).addDays(-1),
				this.location.latitude,
				this.location.longitude
			);
			rise = yesterday.rise;
			set = today.set;
		}

		return {
			rise: rise.getTime() + rise.getTimezoneOffset() * 60 * 1000,
			set: set.getTime() + set.getTimezoneOffset() * 60 * 1000,
			highest: this.findHighest(rise, set),
		};
	}

	findHighest(rise, set) {
		let lastHighestAltitude,
			guessHighest,
			guessHighestPosition,
			highest,
			highestPosition,
			direction;

		// Start halfway through the moon's path
		guessHighest = new Dative(rise);
		guessHighest.addMilliseconds((set - rise) / 2);
		guessHighestPosition = SunCalc.getMoonPosition(
			guessHighest,
			this.location.latitude,
			this.location.longitude
		);
		lastHighestAltitude = guessHighestPosition.altitude;

		// find the direction to go in
		highest = new Dative(guessHighest);
		highest.addMilliseconds(60000);
		highestPosition = SunCalc.getMoonPosition(
			highest,
			this.location.latitude,
			this.location.longitude
		);
		highest.addMilliseconds(-60000);
		direction = highestPosition.altitude > lastHighestAltitude ? 1 : -1;

		// Now start going in that direction
		highest.addMilliseconds(direction * 60000);
		highestPosition = SunCalc.getMoonPosition(
			highest,
			this.location.latitude,
			this.location.longitude
		);

		// Find the highest altitude
		while (highestPosition.altitude > lastHighestAltitude) {
			highest.addMilliseconds(direction * 60000);
			highestPosition = SunCalc.getMoonPosition(
				highest,
				this.location.latitude,
				this.location.longitude
			);
			lastHighestAltitude = highestPosition.altitude;
		}

		return highest.getTime() + highest.getTimezoneOffset() * 60 * 1000;
	}

	static placeSun() {
		const skyEvents = new SkyEvents(),
			sun = skyEvents.getCurrentSun();
		if (sun) {
			const clock = new Clock(),
				pos = polarToRect(clock.radius * 1.3, Time.asClockAngle(sun.noon)),
				sunIcon = qid('Sun'),
				sunGradient = qid('SunGradient'),
				sunBurst = qid('SunBurst');

			sunIcon.setAttribute('cx', pos.x);
			sunIcon.setAttribute('cy', pos.y);
			sunGradient.setAttribute('cx', pos.x);
			sunGradient.setAttribute('cy', pos.y);
			sunBurst.setAttribute(
				'transform',
				`translate(${pos.x - 59.7}, ${pos.y - 59.2})`
			);
		} else {
			throw new Error('No sun data');
		}
	}

	static placeMoon() {
		const skyEvents = new SkyEvents(),
			moon = skyEvents.getCurrentMoon();
		if (moon) {
			const clock = new Clock(),
				pos = polarToRect(clock.radius * 1.3, Time.asClockAngle(moon.highest)),
				moonIcon = qid('Moon'),
				r = moonIcon.getAttribute('width') / 2;
			moonIcon.setAttribute('x', pos.x - r);
			moonIcon.setAttribute('y', pos.y - r);
		} else {
			throw new Error('No moon data');
		}
	}

	static getSegmentPath(start, end, closePath = true) {
		start = new Dative().setTimeComponent(
			new Dative(start).toString('H:i:s.u')
		);
		end = new Dative().setTimeComponent(new Dative(end).toString('H:i:s.u'));

		if (start > end) {
			start = start.addDays(-1);
		}

		const radius = closePath ? 400 : 1.3 * new Clock().radius,
			largeArcFlag = end - start > 86400000 / 2 ? 1 : 0,
			startPos = polarToRect(radius, Time.asClockAngle(start)),
			endPos = polarToRect(radius, Time.asClockAngle(end));

		if (closePath) {
			return `M 0 0 L ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y} Z`;
		} else {
			return `M ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y}`;
		}
	}

	static drawDaylightHours() {
		const daylightHours = qid('DaylightHours'),
			skyEvents = new SkyEvents(),
			sun = skyEvents.getCurrentSun();

		const phases = {
			astroDawn: {
				start: sun.astroDawn,
				end: sun.nauticalDawn,
				id: 'DawnAstronomicalTwilight',
			},
			nauticalDawn: {
				start: sun.nauticalDawn,
				end: sun.civilDawn,
				id: 'DawnNauticalTwilight',
			},
			civilDawn: {
				start: sun.civilDawn,
				end: sun.rise,
				id: 'DawnCivilTwilight',
			},
			day: {
				start: sun.rise,
				end: sun.set,
				id: 'Day',
			},
			civilDusk: {
				start: sun.set,
				end: sun.nauticalDusk,
				id: 'DuskCivilTwilight',
			},
			nauticalDusk: {
				start: sun.nauticalDusk,
				end: sun.astroDusk,
				id: 'DuskNauticalTwilight',
			},
			astronomicalDusk: {
				start: sun.astroDusk,
				end: sun.night,
				id: 'DuskAstronomicalTwilight',
			},
			night: {
				start: sun.set,
				end: sun.rise,
				id: 'Night',
			},
		};

		for (const phaseName in phases) {
			const phase = phases[phaseName];
			const element = qid(phase.id);
			const path = SkyEvents.getSegmentPath(phase.start, phase.end);
			if (element) {
				element.setAttribute('d', path);
			} else {
				daylightHours.prepend(
					createElement(
						`<path d="${path}" id="${phase.id}" class="transparent">`,
						'svg'
					)
				);
			}
		}

		setTimeout(function () {
			const phases = qq('#DaylightHours .transparent');
			phases.forEach((phase) => {
				phase.classList.remove('transparent');
			});
		}, 1);

		Clock.removeLoadingSpinner();
	}

	static drawMoonlightArc() {
		const moonlight = qid('MoonlightArc'),
			skyEvents = new SkyEvents(),
			moon = skyEvents.getCurrentMoon(),
			moonPath = SkyEvents.getSegmentPath(moon.rise, moon.set, false);

		if (moonlight) {
			moonlight.setAttribute('d', moonPath);
		} else {
			qid('MoonlightHours').appendChild(
				createElement(`<path d="${moonPath}" id="MoonlightArc">`, 'svg')
			);
		}

		SkyEvents.drawMoonlightBar(moon);

		setTimeout(function () {
			qid('MoonlightHours').classList.remove('transparent');
		}, 1);

		Clock.removeLoadingSpinner();
	}

	static drawMoonlightBar(moon) {
		const clock = new Clock(),
			moonlightBar = qid('MoonlightBar'),
			skyEvents = new SkyEvents();
		let removeTransparency = false,
			moonPath,
			start;

		if (typeof moon == 'undefined') {
			moon = skyEvents.getCurrentMoon();
		}

		moon.rise = new Dative(moon.rise);
		moon.set = new Dative(moon.set);

		if (clock.now().isBetween(moon.rise, moon.set)) {
			start = clock.now();
		} else if (clock.now() >= moon.set) {
			if (moonlightBar) {
				moonlightBar.remove();
			}
		} else if (clock.now() <= moon.rise) {
			start = moon.rise;
		}

		moonPath = SkyEvents.getSegmentPath(start, moon.set, false);

		if (moonlightBar) {
			moonlightBar.setAttribute('d', moonPath);
		} else {
			qid('MoonlightHours').prepend(
				createElement(`<path d="${moonPath}" id="MoonlightBar">`, 'svg')
			);
			removeTransparency = true;
		}

		if (removeTransparency) {
			setTimeout(function () {
				qid('MoonlightHours').classList.remove('transparent');
			}, 1);
		}
	}

	static updateMoonlightBar() {
		const clock = new Clock(),
			moonlightBar = qid('MoonlightBar');

		if (moonlightBar) {
			const skyEvents = new SkyEvents(),
				moon = skyEvents.getCurrentMoon();

			moon.rise = new Dative(moon.rise);
			moon.set = new Dative(moon.set);

			if (clock.now().isBetween(moon.rise, moon.set)) {
				moonlightBar.setAttribute(
					'd',
					SkyEvents.getSegmentPath(clock.now(), moon.set, false)
				);
			} else if (clock.now() >= moon.set) {
				moonlightBar.remove();
			}
		}
	}

	static changeMoonPhase() {
		// TODO update angle of rotation in the sky

		const moon = qid('Moon'),
			w = parseFloat(moon.getAttribute('width')),
			r = w / 2,
			xOrigin = parseFloat(moon.getAttribute('x')) + r,
			top = parseFloat(moon.getAttribute('y')),
			bottom = top + w,
			skyEvents = new SkyEvents(),
			currentSun = skyEvents.getCurrentSun(),
			currentMoon = skyEvents.getCurrentMoon(),
			moonHighest = new Dative(currentMoon.highest),
			illumination = SunCalc.getMoonIllumination(new Dative(currentMoon.highest));
		let phase = illumination.phaseValue >= 1 ? 0 : illumination.phaseValue,
			d;

		phase = phase >= 1 ? 0 : phase;
		phase = phase.toFixed(3);

		if (phase == 0) {
			d = `M ${xOrigin} ${top}
				A ${r} ${r} 0 0 1 ${xOrigin} ${bottom}
				A ${r} ${r} 0 0 1 ${xOrigin} ${top}`;
		} else if (phase == 1) {
			d = `M ${xOrigin} ${top}
				A ${r} ${r} 0 0 0 ${xOrigin} ${bottom}
				A ${r} ${r} 0 0 1 ${xOrigin} ${top}`;
		} else {
			const clockwise = phase > 0.5 ? 1 : 0,
				correctedPhase = phase > 0.5 ? phase - 0.5 : phase, // waning phase is over by .5
				portionOfHalf = correctedPhase / 0.25, // 0 is center, 1 is edge
				right = 1 - portionOfHalf, // proportion towards right from center
				x = xOrigin + r * right * 1.3333333; // tip of the curve between light and dark

			d = `M ${xOrigin} ${top}
				C ${x} ${top},
				  ${x} ${bottom},
				  ${xOrigin} ${bottom}
				A ${r} ${r} 0 0 ${clockwise} ${xOrigin} ${top}`;
		}

		qid('Shadow').setAttribute('d', d);

		// if (skyEvents.location) {
		// 	let position = SunCalc.getMoonPosition(moonHighest, skyEvents.location.latitude, skyEvents.location.longitude),
		// 		radians = illumination.angle - position.parallacticAngle,
		// 		degrees = radians / (Math.PI/180);
		// 	qid('Moon').setAttribute('transform', `rotate(${degrees} ${xOrigin - r} ${top + r})`);
		// 	qid('Shadow').setAttribute('transform', `rotate(${degrees} ${xOrigin - r} ${top + r})`);
		// }

		moon.classList.toggle(
			'daytime-moon',
			moonHighest.isBetween(
				new Dative(currentSun.rise).toString('H:i'),
				new Dative(currentSun.set).toString('H:i')
			)
		);
	}
}

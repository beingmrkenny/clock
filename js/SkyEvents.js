// TODO test this independently

class SkyEvents {
	constructor() {
		const clock = new Clock();

		this.now = clock.now();
		this.location = clock.data.getItem('location');

		if (this.location) {
			const times = [
				new Dative(this.now).addDays(-1),
				new Dative(this.now),
				new Dative(this.now).addDays(1),
			];

			this.sun = {
				yesterday: SunCalc.getSunTimes(
					times[0],
					this.location.latitude,
					this.location.longitude
				),
				today: SunCalc.getSunTimes(
					times[1],
					this.location.latitude,
					this.location.longitude
				),
				tomorrow: SunCalc.getSunTimes(
					times[2],
					this.location.latitude,
					this.location.longitude
				),
			};

			for (const day in this.sun) {
				for (const eventName in this.sun[day]) {
					this.sun[day][eventName] = new Date(this.sun[day][eventName].value);
				}
			}
		}
	}

	sunIsUp() {
		return (
			this.now >= this.sun.today.sunriseEnd &&
			this.now < this.sun.today.sunsetStart
		);
	}

	sunIsDown() {
		return this.sunIsDownPM() || this.sunIsDownAm();
	}

	sunIsDownPM() {
		// QUESTION refer to midnight?
		return (
			!this.sunIsUp() &&
			this.now >= this.sun.today.sunsetStart &&
			this.now < this.sun.tomorrow.sunriseEnd
		);
	}

	sunIsDownAM() {
		// QUESTION refer to midnight?
		return (
			!this.sunIsUp() &&
			this.now > this.sun.yesterday.sunsetStart &&
			this.now < this.sun.today.sunriseEnd
		);
	}

	getCurrentSun() {
		const clock = new Clock();
		let astroDawn,
			nauticalDawn,
			civilDawn,
			sunrise,
			sunset,
			civilDusk,
			nauticalDusk,
			astroDusk,
			night,
			refresh;

		if (this.sunIsUp()) {
			astroDawn = this.sun.today.astronomicalDawn;
			nauticalDawn = this.sun.today.nauticalDawn;
			civilDawn = this.sun.today.civilDawn;
			sunrise = this.sun.today.sunriseEnd;
			sunset = this.sun.today.sunsetStart;
			civilDusk = this.sun.today.sunsetStart;
			nauticalDusk = this.sun.today.civilDusk;
			astroDusk = this.sun.today.nauticalDusk;
			night = this.sun.today.astronomicalDusk;
		} else if (this.sunIsDownPM()) {
			astroDawn = this.sun.tomorrow.astronomicalDawn;
			nauticalDawn = this.sun.tomorrow.nauticalDawn;
			civilDawn = this.sun.tomorrow.civilDawn;
			sunrise = this.sun.tomorrow.sunriseEnd;
			sunset = this.sun.today.sunsetStart;
			civilDusk = this.sun.today.sunsetStart;
			nauticalDusk = this.sun.today.civilDusk;
			astroDusk = this.sun.today.nauticalDusk;
			night = this.sun.today.astronomicalDusk;
		} else if (this.sunIsDownAM()) {
			astroDawn = this.sun.today.astronomicalDawn;
			nauticalDawn = this.sun.today.nauticalDawn;
			civilDawn = this.sun.today.civilDawn;
			sunrise = this.sun.today.sunriseEnd;
			sunset = this.sun.yesterday.sunsetStart;
			civilDusk = this.sun.yesterday.sunsetStart;
			nauticalDusk = this.sun.yesterday.civilDusk;
			astroDusk = this.sun.yesterday.nauticalDusk;
			night = this.sun.yesterday.astronomicalDusk;
		}

		if (sunset <= this.now && sunrise > this.now) {
			refresh = sunrise;
		} else if (sunrise <= this.now && sunset > this.now) {
			refresh = sunset;
		}
		clock.globalVariables.setItem(
			'refreshSun',
			new Dative(refresh).toString('Y-m-d H:i:s')
		);

		// TODO noon should refresh in the same way that moonnoon refreshes
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
			noon: this.sun.today.solarNoon,
		};
	}

	getCurrentMoon(now) {
		// QUESTION seems horrendously clumsy — five days calc — there might be a more mathematical way to do it without all the fannying

		const clock = new Clock(),
			moonStore = new LocalStorage('MOON');
		let moonTimes = moonStore.getItem('moonTimes') || null;

		if (!moonTimes) {
			const times = [
				new Dative(this.now).addDays(-2),
				new Dative(this.now).addDays(-1),
				new Dative(this.now),
				new Dative(this.now).addDays(1),
				new Dative(this.now).addDays(2),
			];

			const allMoonTimes = [
				SunCalc.getMoonTimes(
					times[0],
					this.location.latitude,
					this.location.longitude,
					true
				),
				SunCalc.getMoonTimes(
					times[1],
					this.location.latitude,
					this.location.longitude
				),
				SunCalc.getMoonTimes(
					times[2],
					this.location.latitude,
					this.location.longitude
				),
				SunCalc.getMoonTimes(
					times[3],
					this.location.latitude,
					this.location.longitude
				),
				SunCalc.getMoonTimes(
					times[4],
					this.location.latitude,
					this.location.longitude
				),
			];

			const moonEvents = [];
			for (let day in allMoonTimes) {
				for (let eventName in allMoonTimes[day]) {
					moonEvents.push({
						time: allMoonTimes[day][eventName],
						name: eventName,
					});
				}
			}
			moonEvents.sort(Time.sortArray);
			if (moonEvents[0].name == 'set') {
				moonEvents.shift();
			}
			if (moonEvents[moonEvents.length - 1].name == 'rise') {
				moonEvents.pop();
			}

			let moon = {};
			moonTimes = [];
			for (let i = 0, x = moonEvents.length; i < x; i++) {
				if (moonEvents[i].name == 'rise') {
					moon.rise = moonEvents[i].time;
				} else if (moonEvents[i].name == 'set') {
					moon.set = moonEvents[i].time;

					// for sorting
					// FIXME this is possibly brock
					moon.time = moon.rise
						? Math.min(
								Math.abs(this.now - moon.rise.valueOf()),
								Math.abs(this.now - moon.set.valueOf())
						  )
						: Math.abs(this.now - moon.set.valueOf());

					moon.refresh = null;

					const next = moonEvents[i + 1];
					if (next) {
						// work out the difference between the next rise and the current sunset
						// refresh is half that time from set
						const diff = new Dative(next.time) - new Dative(moon.set);
						moon.refresh = new Dative(moon.set)
							.addMilliseconds(diff / 2 + 500)
							.toString('Y-m-d H:i:s');
					}

					moonTimes.push(moon);
				}
			}

			moonTimes.sort(Time.sortArray);
			moonTimes[0].noon = this.addMoonNoon(moonTimes[0]);
			if (!clock.globalVariables.getItem('debug')) {
				moonStore.setItem('moonTimes', moonTimes, moonTimes[0].refresh);
			}
		}

		clock.globalVariables.setItem('refreshMoon', moonTimes[0].refresh);

		return moonTimes[0];
	}

	addMoonNoon(moonTimes) {
		let lastHighestAltitude,
			guessMoonNoon,
			guessMoonNoonPosition,
			moonNoon,
			moonNoonPosition,
			direction;

		// Start halfway through the moon's path
		guessMoonNoon = new Dative(moonTimes.rise);
		guessMoonNoon.addMilliseconds((moonTimes.set - moonTimes.rise) / 2);
		guessMoonNoonPosition = SunCalc.getMoonPosition(
			guessMoonNoon,
			this.location.latitude,
			this.location.longitude
		);
		lastHighestAltitude = guessMoonNoonPosition.altitude;

		// find the direction to go in
		moonNoon = new Dative(guessMoonNoon);
		moonNoon.addMilliseconds(60000);
		moonNoonPosition = SunCalc.getMoonPosition(
			moonNoon,
			this.location.latitude,
			this.location.longitude
		);
		moonNoon.addMilliseconds(-60000);
		direction = moonNoonPosition.altitude > lastHighestAltitude ? 1 : -1;

		// Now start going in that direction
		moonNoon.addMilliseconds(direction * 60000);
		moonNoonPosition = SunCalc.getMoonPosition(
			moonNoon,
			this.location.latitude,
			this.location.longitude
		);

		// Find the highest altitude
		while (moonNoonPosition.altitude > lastHighestAltitude) {
			moonNoon.addMilliseconds(direction * 60000);
			moonNoonPosition = SunCalc.getMoonPosition(
				moonNoon,
				this.location.latitude,
				this.location.longitude
			);
			lastHighestAltitude = moonNoonPosition.altitude;
		}

		return moonNoon;
	}

	static placeSun() {
		const skyEvents = new SkyEvents(),
			sun = skyEvents.getCurrentSun();
		if (sun) {
			const clock = new Clock(),
				pos = polarToRect(clock.radius * 1.5, Time.asClockAngle(sun.noon)),
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
				pos = polarToRect(clock.radius * 1.3, Time.asClockAngle(moon.noon)),
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
			moonNoon = new Dative(currentMoon.noon),
			illumination = SunCalc.getMoonIllumination(new Dative(currentMoon.noon));
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
		// 	let position = SunCalc.getMoonPosition(moonNoon, skyEvents.location.latitude, skyEvents.location.longitude),
		// 		radians = illumination.angle - position.parallacticAngle,
		// 		degrees = radians / (Math.PI/180);
		// 	qid('Moon').setAttribute('transform', `rotate(${degrees} ${xOrigin - r} ${top + r})`);
		// 	qid('Shadow').setAttribute('transform', `rotate(${degrees} ${xOrigin - r} ${top + r})`);
		// }

		moon.classList.toggle(
			'daytime-moon',
			moonNoon.isBetween(
				new Dative(currentSun.rise).toString('H:i'),
				new Dative(currentSun.set).toString('H:i')
			)
		);
	}
}

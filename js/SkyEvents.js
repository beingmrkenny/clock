
// TODO test this independently

class SkyEvents {

	constructor () {

		var clock = new Clock();

		this.now = clock.now();
		this.location = clock.data.getItem('location');

		if (this.location) {

			let today = new Dative ();

			let times = [
				new Dative(this.now).addDays(-1),
				new Dative(this.now),
				new Dative(this.now).addDays(1)
			];

			this.sun = {
				yesterday: SunCalc.getTimes(times[0], this.location.latitude, this.location.longitude),
				today:     SunCalc.getTimes(times[1], this.location.latitude, this.location.longitude),
				tomorrow:  SunCalc.getTimes(times[2], this.location.latitude, this.location.longitude),
			};

			for (let day in this.sun) {
				for (let eventName in this.sun[day]) {
					this.sun[day][eventName] = new Date(this.sun[day][eventName].setMilliseconds(0));
				}
			}

		}

	}


	getCurrentSun () {

		var clock = new Clock(),
			sunrise,
			sunset,
			refresh;

		if (this.sunIsUp()) {
			sunrise = this.sun.today.sunrise;
			sunset = this.sun.today.sunset;
		} else if (this.sunIsDownPM()) {
			sunrise = this.sun.tomorrow.sunrise;
			sunset = this.sun.today.sunset;
		} else if (this.sunIsDownAM()) {
			sunrise = this.sun.today.sunrise;
			sunset = this.sun.yesterday.sunset;
		}

		if (sunset <= this.now && sunrise > this.now) {
			refresh = sunrise;
		} else if (sunrise <= this.now && sunset > this.now) {
			refresh = sunset;
		}
		clock.globalVariables.setItem('refreshSun', new Dative(refresh).toString('Y-m-d H:i:s'));

		// TODO noon should refresh in the same way that moonnoon refreshes
		return {
			rise : sunrise,
			set : sunset,
			noon : this.sun.today.solarNoon
		};
	}

	sunIsUp () {
		return (this.now >= this.sun.today.sunrise && this.now < this.sun.today.sunset);
	}

	sunIsDown () {
		return (this.sunIsDownPM() || this.sunIsDownAm());
	}

	sunIsDownPM () {
		// QUESTION refer to midnight?
		return (!this.sunIsUp() && this.now >= this.sun.today.sunset && this.now < this.sun.tomorrow.sunrise);
	}

	sunIsDownAM () {
		// QUESTION refer to midnight?
		return (!this.sunIsUp() && this.now > this.sun.yesterday.sunset && this.now < this.sun.today.sunrise);
	}


	getCurrentMoon (now) {

		// QUESTION seems horrendously clumsy — five days calc — there might be a more mathematical way to do it without all the fannying

		var clock = new Clock(),
			moonStore = new LocalStorage('MOON'),
			moonTimes = moonStore.getItem('moonTimes'),
			currentMoon;

		if (!moonTimes) {

			let times = [
				new Dative(this.now).addDays(-2),
				new Dative(this.now).addDays(-1),
				new Dative(this.now),
				new Dative(this.now).addDays(1),
				new Dative(this.now).addDays(2)
			];

			let allMoonTimes = [
				SunCalc.getMoonTimes(times[0], this.location.latitude, this.location.longitude),
				SunCalc.getMoonTimes(times[1], this.location.latitude, this.location.longitude),
				SunCalc.getMoonTimes(times[2], this.location.latitude, this.location.longitude),
				SunCalc.getMoonTimes(times[3], this.location.latitude, this.location.longitude),
				SunCalc.getMoonTimes(times[4], this.location.latitude, this.location.longitude)
			];

			var moonEvents = [];
			for (let day in allMoonTimes) {
				for (let eventName in allMoonTimes[day]) {
					moonEvents.push({
						time : allMoonTimes[day][eventName],
						name : eventName
					});
				}
			}
			moonEvents.sort(Time.sortArray);
			if (moonEvents[0].name == 'set') {
				moonEvents.shift();
			}
			if (moonEvents[moonEvents.length-1].name == 'rise') {
				moonEvents.pop();
			}

			var moon, moonTimes = [];
			for (let i = 0, x = moonEvents.length; i<x; i++) {

				if (moonEvents[i].name == 'rise') {

					moon = {};
					moon.rise = moonEvents[i].time;

				} else if (moonEvents[i].name == 'set') {

					moon.set = moonEvents[i].time;

					// for sorting
					moon.time = Math.min(
						Math.abs(this.now - moon.rise.valueOf()),
						Math.abs(this.now - moon.set.valueOf())
					);

					moon.refresh = null;

					let next = moonEvents[i+1];
					if (next) {
						// work out the difference between the next rise and the current sunset
						// refresh is half that time from set
						let diff = new Dative (next.time) - new Dative(moon.set);
						moon.refresh = new Dative(moon.set).addMilliseconds((diff/2) + 500).toString('Y-m-d H:i:s');
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

		currentMoon = moonTimes[0];
		clock.globalVariables.setItem('refreshMoon', moonTimes[0].refresh);

		return currentMoon;

	}

	addMoonNoon(moonTimes) {

		var lastHighestAltitude, guessMoonNoon, guessMoonNoonPosition, moonNoon, moonNoonPosition, direction;

		// Start halfway through the moon's path
		guessMoonNoon = new Dative(moonTimes.rise);
		guessMoonNoon.addMilliseconds((moonTimes.set - moonTimes.rise)/2);
		guessMoonNoonPosition = SunCalc.getMoonPosition(guessMoonNoon, location.latitude, location.longitude);
		lastHighestAltitude = guessMoonNoonPosition.altitude;

		// find the direction to go in
		moonNoon = new Dative(guessMoonNoon);
		moonNoon.addMilliseconds(60000);
		moonNoonPosition = SunCalc.getMoonPosition(moonNoon, location.latitude, location.longitude);
		moonNoon.addMilliseconds(-60000);
		direction = ( moonNoonPosition.altitude > lastHighestAltitude ) ? 1 : -1;

		// Now start going in that direction
		moonNoon.addMilliseconds(direction * 60000);
		moonNoonPosition = SunCalc.getMoonPosition(moonNoon, location.latitude, location.longitude);

		// Find the highest altitude
		while (moonNoonPosition.altitude > lastHighestAltitude) {
			moonNoon.addMilliseconds(direction * 60000);
			moonNoonPosition = SunCalc.getMoonPosition(moonNoon, location.latitude, location.longitude);
			lastHighestAltitude = moonNoonPosition.altitude;
		}

		return moonNoon;

	}


	static placeSun () {
		var skyEvents = new SkyEvents(),
			sun       = skyEvents.getCurrentSun();
		if (sun) {
			let clock       = new Clock(),
				pos         = $number.polarToRect(clock.radius * 1.5, Time.asClockAngle(sun.noon)),
				sunIcon     = qid('Sun'),
				sunGradient = qid('SunGradient'),
				sunBurst   = qid('SunBurst');

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

	static placeMoon () {
		var skyEvents = new SkyEvents(),
			moon = skyEvents.getCurrentMoon();
		if (moon) {
			let clock    = new Clock(),
				pos      = $number.polarToRect(clock.radius * 1.3, Time.asClockAngle(moon.noon)),
				moonIcon = qid('Moon'),
				r		 = moonIcon.getAttribute('width') / 2;
			moonIcon.setAttribute('x', pos.x - r);
			moonIcon.setAttribute('y', pos.y - r);
		} else {
			throw new Error('No moon data');
		}
	}

	static getSegmentPath (start, end, daylightHours) {

		start = new Dative().setTimeComponent(
			new Dative(start).toString('H:i:s.u')
		);
		end = new Dative().setTimeComponent(
			new Dative(end).toString('H:i:s.u')
		);

		if (start > end) {
			start = start.addDays(-1);
		}

		var radius = (daylightHours) ? 400 : 1.3 * (new Clock).radius;
		var largeArcFlag = ((end - start) > (86400000 / 2)) ? 1 : 0,
			startPos = $number.polarToRect(radius, Time.asClockAngle(start)),
			endPos   = $number.polarToRect(radius, Time.asClockAngle(end));

		if (daylightHours) {
			return `M 0 0 L ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y} Z`;
		} else {
			return `M ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y}`;
		}
	}

	static drawDaylightHours () {
		var clock         = new Clock(),
			daylightHours = qid('DaylightHours'),
			day           = qid('Day'),
			night         = qid('Night'),
			skyEvents     = new SkyEvents(),
			sun           = skyEvents.getCurrentSun(),
			dayPath       = SkyEvents.getSegmentPath(sun.rise, sun.set, true),
			nightPath     = SkyEvents.getSegmentPath(sun.set, sun.rise, true);

		if (day) {
			day.setAttribute('d', dayPath);
		} else {
			daylightHours.prependChild($dom.createElement(`<path d="${dayPath}" id="Day" class="transparent">`, 'svg'));
		}

		if (night) {
			night.setAttribute('d', nightPath);
		} else {
			daylightHours.prependChild($dom.createElement(`<path d="${nightPath}" id="Night" class="transparent">`, 'svg'));
		}

		setTimeout(function () {
			qid('Day').classList.remove('transparent');
			qid('Night').classList.remove('transparent');
		}, 1);

		Clock.removeLoadingSpinner();
	}

	static drawMoonlightArc () {
		var clock     = new Clock(),
			moonlight = qid('MoonlightArc'),
			skyEvents = new SkyEvents(),
			moon      = skyEvents.getCurrentMoon(),
			moonPath  = SkyEvents.getSegmentPath(moon.rise, moon.set, false);

		if (moonlight) {
			moonlight.setAttribute('d', moonPath);
		} else {
			qid('MoonlightHours').appendChild(
				$dom.createElement(`<path d="${moonPath}" id="MoonlightArc">`, 'svg')
			);
		}

		SkyEvents.drawMoonlightBar(moon);

		setTimeout(function () {
			qid('MoonlightHours').classList.remove('transparent');
		}, 1);

		Clock.removeLoadingSpinner();
	}

	static drawMoonlightBar (moon) {

		var clock              = new Clock(),
			moonlightBar       = qid('MoonlightBar'),
			skyEvents          = new SkyEvents(),
			removeTransparency = false,
			moonPath, start;

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
		} else if (clock.now () <= moon.rise) {
			start = moon.rise;
		}

		moonPath  = SkyEvents.getSegmentPath(start, moon.set, false);

		if (moonlightBar) {
			moonlightBar.setAttribute('d', moonPath);
		} else {
			qid('MoonlightHours').prependChild(
				$dom.createElement(`<path d="${moonPath}" id="MoonlightBar">`, 'svg')
			);
			removeTransparency = true;
		}

		if (removeTransparency) {
			setTimeout(function () {
				qid('MoonlightHours').classList.remove('transparent');
			}, 1);
		}

	}

	static updateMoonlightBar () {

		var clock        = new Clock(),
			moonlightBar = qid('MoonlightBar');

		if (moonlightBar) {

			let skyEvents = new SkyEvents(),
				moon      = skyEvents.getCurrentMoon();

			moon.rise = new Dative(moon.rise);
			moon.set = new Dative(moon.set);

			if (clock.now().isBetween(moon.rise, moon.set)) {
				moonlightBar.setAttribute( 'd', SkyEvents.getSegmentPath(clock.now(), moon.set, false) );
			} else if (clock.now() >= moon.set) {
				moonlightBar.remove();
			}

		}

	}

	static changeMoonPhase() {

		// TODO update angle

		var clock        = new Clock(),
			moon         = qid('Moon'),
			w            = parseFloat(moon.getAttribute('width')),
			r			 = w / 2,
			xOrigin      = parseFloat(moon.getAttribute('x')) + r,
			top          = parseFloat(moon.getAttribute('y')),
			bottom       = top + w,
			skyEvents    = new SkyEvents(),
			currentSun   = skyEvents.getCurrentSun(),
			currentMoon  = skyEvents.getCurrentMoon(),
			moonNoon     = new Dative(currentMoon.noon),
			illumination = SunCalc.getMoonIllumination(new Dative(currentMoon.noon)),
			phase        = (illumination.phase >= 1) ? 0: illumination.phase,
			d;

		phase = (phase >= 1) ? 0 : phase;
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

			let clockwise      = (phase > .5) ? 1 : 0,
				correctedPhase = (phase > .5) ? phase - 0.5 : phase, // waning phase is over by .5
				portionOfHalf  = correctedPhase / .25, // 0 is center, 1 is edge
				right          = 1 - portionOfHalf, // proportion towards right from center
				x              = xOrigin + ( (r * right) * 1.3333333 ); // tip of the curve between light and dark

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

		moon.classList.toggle('daytime-moon', moonNoon.isBetween(
			new Dative(currentSun.rise).toString('H:i'),
			new Dative(currentSun.set).toString('H:i')
		));

	}

}



	// NOTE It is entirely possible that the remaining code in this file is completely pointless shite



	moonIsAlwaysUp () {
		return this.moon.today.alwaysUp;
	}

	moonIsAlwaysDown () {
		return this.moon.today.alwaysDown;
	}

	moonIsUpTest (rise, set) {

		var today = this.moon.today,
			tomorrow = this.moon.tomorrow,
			yesterday = this.moon.yesterday;

		if (rise == 'today' && set == 'today') {

			return (
				today.rise && today.set
				&& today.rise < today.set
				&& today.rise < this.now
				&& today.set > this.now
			);

		} else if (rise == 'yesterday' && set == 'today') {

			return (
				!today.rise && yesterday.rise && today.set
				&& yesterday.rise < this.now
				&& today.set > this.now
			);

		} else if (rise == 'today' && set == 'tomorrow') {

			return (
				today.rise && !today.set && tomorrow.set
				&& today.rise < this.now
				&& tomorrow.set > this.now
			);

		}

	}

	moonIsDownTest (set, rise) {

		if (set == 'today' && rise == 'today') {

			return (
				today.set && today.rise
				&& today.set < today.rise
				&& today.set < this.now
				&& today.rise > this.now
			);

		} else if (set == 'today' && rise == 'tomorrow') {

			return (
				today.set && tomorrow.rise
				&& (!today.rise || today.rise < today.set)
				&& today.set < this.now
				&& tomorrow.rise > this.now
			);

		} else if (set == 'yesterday' && rise == 'today') {

			return (
				yesterday.set && today.rise
				&& (!yesterday.rise || yesterday.rise < yesterday.set)
				&& yesterday.set < this.now
				&& today.rise > this.now
			);

		}

	}

	// TODO these are speculative code - not needed

	// moonIsUp () {
	// 	return (
	// 		this.moonIsAlwaysUp()
	// 		|| this.moonIsUpTest('today', 'today')
	// 		|| this.moonIsUpTest('yesterday', 'today')
	// 		|| this.moonIsUpTest('today', 'tomorrow')
	// 	);
	// }
	//
	// moonIsDown () {
	// 	return (
	// 		this.moonIsAlwaysDown()
	// 		|| this.moonIsDownTest('today', 'today')
	// 		|| this.moonIsDownTest('today', 'tomorrow')
	// 		|| this.moonIsDownTest('yesterday', 'today')
	// 	);
	// }



	static getForNow () {

		var returnValue = false;

		var skyEventTimes = new SkyEventTimes();

		if (skyEventTimes.location) {

			// TODO we need noon here too

			var sunrise, sunset, moonrise, moonset;

			if (skyEventTimes.sunIsUp()) {
				sunrise = skyEventTimes.sun.today.sunrise;
				sunset = skyEventTimes.sun.today.sunset;
			} else if (skyEventTimes.sunIsDownPM()) {
				sunrise = skyEventTimes.sun.tomorrow.sunrise;
				sunset = skyEventTimes.sun.today.sunset;
			} else if (skyEventTimes.sunIsDownAM()) {
				sunrise = skyEventTimes.sun.today.sunrise;
				sunset = skyEventTimes.sun.yesterday.sunset;
			}

			// QUESTION these moon times are weird. They are literally just giving you want they say they are. Might not be useful. We want to get the most recent complete time for the moon to be in the sky

			if (skyEventTimes.moonIsUpTest('today', 'today')) {
				moonrise = skyEventTimes.moon.today.rise;
				moonset = skyEventTimes.moon.today.set;
			} else if (skyEventTimes.moonIsUpTest('yesterday', 'today')) {
				moonrise = skyEventTimes.moon.yesterday.rise;
				moonset = skyEventTimes.moon.today.set;
			} else if (skyEventTimes.moonIsUpTest('today', 'tomorrow')) {
				moonrise = skyEventTimes.moon.today.rise;
				moonset = skyEventTimes.moon.tomorrow.set;
			} else if (skyEventTimes.moonIsDownTest('today', 'today')) {
				moonset = skyEventTimes.moon.today.set;
				moonrise = skyEventTimes.moon.today.rise;
			} else if (skyEventTimes.moonIsDownTest('today', 'tomorrow')) {
				moonset = skyEventTimes.moon.today.set;
				moonrise = skyEventTimes.moon.tomorrow.rise;
			} else if (skyEventTimes.moonIsDownTest('yesterday', 'today')) {
				moonset = skyEventTimes.moon.yesterday.set;
				moonrise = skyEventTimes.moon.today.rise;
			}

			returnValue = {
				sunrise: sunrise,
				sunset: sunset,
				moonrise: moonrise,
				moonset: moonset
			}

			// QUESTION if no rise or set, is it up all day or down all day

		}

		return returnValue;

	}

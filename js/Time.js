class Time {
	static asClockAngle(givenTime) {
		const globalVariables = new GlobalVariables('CLOCK'),
			time = new Dative(givenTime || null),
			midnight = new Dative(time).setHours(0, 0, 0, 0);

		const anglesPerHour = 360 / globalVariables.getItem('hoursInADay');

		const timezoneOffsetDifferenceBetweenAMAndPM =
			time.getTimezoneOffsetDifferenceBetweenAMAndPM();

		let offset = 0;
		if (timezoneOffsetDifferenceBetweenAMAndPM == 0 && time.isDST()) {
			offset = anglesPerHour;
		} else if (timezoneOffsetDifferenceBetweenAMAndPM < 0) {
			offset = anglesPerHour;
		}

		// const offset = time.isDST() ? 2 * anglesPerHour : 0; // QUESTION DST why is this 2*?

		const msInADay = globalVariables.getItem('msInADay');
		const asDecimalThroughDay =
			(time.valueOf() - midnight.valueOf()) / msInADay;
		return 180 - offset + asDecimalThroughDay * 360;
	}

	static asClockAnglePolar(givenTime) {
		return -(Time.asClockAngle(givenTime) + 90);
	}

	static getArrayOfHours(now) {
		const TimezoneOffsetDifferenceBetweenAMAndPM =
			new Dative().getTimezoneOffsetDifferenceBetweenAMAndPM(now);
		let timeOfDSTChange = null;
		if (TimezoneOffsetDifferenceBetweenAMAndPM != 0) {
			timeOfDSTChange = Dative.findTimeOfDSTChange(now).format('G');
		}
		let arrayOfHours = [];
		for (let h = 0; h < 24; h++) {
			if (TimezoneOffsetDifferenceBetweenAMAndPM == 0 || h != timeOfDSTChange) {
				arrayOfHours.push(h);
			} else if (
				TimezoneOffsetDifferenceBetweenAMAndPM > 0 &&
				h == timeOfDSTChange
			) {
				arrayOfHours.push(h - TimezoneOffsetDifferenceBetweenAMAndPM / 60);
				arrayOfHours.push(h);
			}
		}
		return arrayOfHours;
	}

	/**
	 * Sorts an array of objects which have a time property.
	 * Sorts them earliest first
	 * usage: array.sort(Time.sortArray)
	 */
	static sortArray(a, b) {
		var sortValue;
		switch (true) {
			case a.time < b.time:
				sortValue = -1;
				break;
			case a.time == b.time:
				sortValue = 0;
				break;
			case a.time > b.time:
				sortValue = 1;
				break;
		}
		return sortValue;
	}
}

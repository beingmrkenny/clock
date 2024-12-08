class Time {
	static asClockAngle(givenTime) {
		const globalVariables = new GlobalVariables('CLOCK'),
			time = new Dative(givenTime || null),
			midnight = new Dative(time).setHours(0, 0, 0, 0),
			msInADay = globalVariables.getItem('msInADay'),
			asDecimalThroughDay = (time.valueOf() - midnight.valueOf()) / msInADay;
		return 180 + asDecimalThroughDay * 360;
	}

	static asClockAnglePolar(givenTime) {
		return -(Time.asClockAngle(givenTime) + 90);
	}

	static getArrayOfHours(now) {
		const TimezoneOffsetDifferenceBetweenAMAndPM = new Dative().getTimezoneOffsetDifferenceBetweenAMAndPM(now);
		let timeOfDSTChange = null;
		if (TimezoneOffsetDifferenceBetweenAMAndPM != 0) {
			timeOfDSTChange = Dative.findTimeOfDSTChange(now).format('G');
		}
		let arrayOfHours = [];
		for (let h = 0; h < 24; h++) {
			if (TimezoneOffsetDifferenceBetweenAMAndPM == 0 || h != timeOfDSTChange) {
				arrayOfHours.push(h);
			} else if (TimezoneOffsetDifferenceBetweenAMAndPM > 0 && h == timeOfDSTChange) {
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

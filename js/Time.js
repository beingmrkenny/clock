class Time {

	static asMillisecondsPastMidnight (givenTime) {
		var time = new Dative(givenTime || null);

		var midnight = new Date(time);
		midnight.setHours(0, 0, 0, 0);

		return time.valueOf() - midnight.valueOf();
	}

	static asSecondsPastMidnight (givenTime) {
		return Math.round(Time.asMillisecondsPastMidnight(givenTime) / 1000);
	}

	static asDecimalThroughDay (givenTime) {
		return Time.asMillisecondsPastMidnight(givenTime) / 86400000;
	}

	static asClockAngle (givenTime) {
		return 180 + (Time.asDecimalThroughDay(givenTime) * 360);
	}

	static asClockAnglePolar (givenTime) {
		return - (Time.asClockAngle(givenTime) + 90);
	}

	static getArrayOfHours(now) {
		const DSTChangeForToday = new Dative().getDSTChangeForToday(now);
		let timeOfDSTChange = null;
		if (DSTChangeForToday != 0) {
			timeOfDSTChange = Dative.findTimeOfDSTChange(now).format('G');
		}
		let arrayOfHours = [];
		for (let h = 0; h < 24; h++) {
			if (DSTChangeForToday == 0 || h != timeOfDSTChange) {
				arrayOfHours.push(h);
			} else if (DSTChangeForToday > 0 && h == timeOfDSTChange) {
				arrayOfHours.push(h - (DSTChangeForToday/60));
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
			case (a.time  < b.time) : sortValue = -1; break;
			case (a.time == b.time) : sortValue =  0; break;
			case (a.time >  b.time) : sortValue =  1; break;
		}
		return sortValue;
	}

}

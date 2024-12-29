class Time {
	static asClockAngle(givenTime) {
		const time = new Dative(givenTime || null),
			midnight = new Dative(time).setUTCHours(0, 0, 0, 0),
			asDecimalThroughDay =
				(time.valueOf() - midnight.valueOf()) / (24 * 60 * 60 * 1000);
		return 180 + asDecimalThroughDay * 360;
	}

	// static asClockAnglePolar(givenTime) {
	// 	return -(Time.asClockAngle(givenTime) + 90);
	// }

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

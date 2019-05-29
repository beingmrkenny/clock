class Events {

	static drawArc (start, end) {

		var clock = new Clock();

		start = new Dative().setTimeComponent(
			new Dative(start).toString('H:i:s.u')
		);
		end = new Dative().setTimeComponent(
			new Dative(end).toString('H:i:s.u')
		);

		if (start > end) {
			start = start.addDays(-1);
		}

		var radius = 1 * clock.radius;
		var largeArcFlag = ((end - start) > (86400000 / 2)) ? 1 : 0,
			startPos = $number.polarToRect(radius, Time.asClockAngle(start)),
			endPos   = $number.polarToRect(radius, Time.asClockAngle(end)),
			workPath = `M ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y}`,
			workArc = $dom.createElement(`<path d="${workPath}" id="WorkArc">`, 'svg');

		clock.face.appendChild(workArc);
	}

	static drawWorkArc () {
		Events.drawArc ('09.00', '17.30');
	}

}

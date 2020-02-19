// Draws the clock
// Manages time
// Manages data

class Clock {

	constructor () {
		this.svg = qid('ClockSVG');
		// NOTE: The compiler chokes on this and I don't want to define it all to hell in externs.js
		this.radius = this.svg.viewBox.baseVal.width / 3;
		this.face = qid('Face');
		this.data = new LocalStorage('CLOCK');
		this.globalVariables = new GlobalVariables('CLOCK');
	}

	// Time stuff

	now () {
		var now = new Dative(this.globalVariables.getItem('now') || null);
		now.setMilliseconds(0);
		return new Dative(now);
	}

	setNow (datetimeToShow) {
		let newNow = new Dative(datetimeToShow, false);
		if (typeof datetimeToShow == 'string') {
			let timeComponent = Dative.getTimeComponentFromDateDataIfTimeString(datetimeToShow);
			newNow.setHours        ( newNow.getHours()        + (timeComponent[0] - newNow.getHours()) );
			newNow.setMinutes      ( newNow.getMinutes()      + (timeComponent[1] - newNow.getMinutes()) );
			newNow.setSeconds      ( newNow.getSeconds()      + (timeComponent[2] - newNow.getSeconds()) );
			newNow.setMilliseconds ( newNow.getMilliseconds() + (timeComponent[3] - newNow.getMilliseconds()) );
		}
		this.globalVariables.setItem('now', newNow);
	}

	tick () {

		// TEMP: pissy code
		// var thisDSTOffset = this.now().getTimezoneOffsetFromWinter(),
		// 	thatDSTOffset = this.globalVariables.getItem('thatDSTOffset');
		// if (thisDSTOffset !== thatDSTOffset) {
		// 	this.reDraw();
		// }

		this.globalVariables.setItem('thatDSTOffset', thisDSTOffset);

		this.showCurrentTime();
		this.showCurrentDate();

		var refreshSun = this.globalVariables.getItem('refreshSun'),
			refreshMoon = this.globalVariables.getItem('refreshMoon'),
			now = new Dative(this.now()).toString('Y-m-d H:i:s');

		if (this.globalVariables.getItem('debug')) {
			qid('DebugTime').textContent = new Dative(this.now()).toString('j M, H:i:s P');
		}

		// TEMP
		if (now == refreshSun || now == refreshMoon) {
			this.drawHours();
		}

		if (now == refreshSun) {
			SkyEvents.placeSun();
			SkyEvents.drawDaylightHours();
		}

		if (now == refreshMoon) {
			SkyEvents.placeMoon();
			SkyEvents.drawMoonlightArc();
		}

		if (qid('MoonlightBar')) {
			LocationService.execute(SkyEvents.updateMoonlightBar, true);
		}

		var savedNow = this.globalVariables.getItem('now');
		if (savedNow) {
			this.setNow(savedNow.addMilliseconds(msAdvance));
		}

	}

	start () {

		var timer;

		this.stop();
		this.globalVariables.setItem('thatDSTOffset', this.now().getTimezoneOffsetFromWinter());

		this.tick();
		timer = function () {
			var clock = new Clock();
			clock.tick();
		};

		this.globalVariables.setItem(
			'tickTimer',
			setInterval(timer, msInterval)
		);

		qid('HourHand').style.opacity = 1;
	}

	stop () {
		clearInterval(this.globalVariables.getItem('tickTimer'));
		qid('HourHand').style.opacity = 0.5;
	}

	showTime(dateTime) {
		var angle = Time.asDSTCorrectedClockAngle(dateTime);
		qid('HourHand').setAttribute('transform', `rotate(${angle})`);
	}

	showCurrentTime() {
		this.showTime(this.now());
	}

	showCurrentDate() {

		var actualNow = new Dative(),
			now = new Dative(this.now()),
			dateComplication = q('#Date'),
			format = 'D j';

		format += (actualNow.toString('Y-m') != now.toString('Y-m')) ? ' M' : '';
		format += (actualNow.getFullYear()   != now.getFullYear())   ? ' Y' : '';

		dateComplication.textContent = now.toString(format);

	}

	// Drawing stuff

	drawFace () {
		this.drawHours();
		this.drawTicks();
		this.drawHand();
		qid('Disc').setAttribute('r', this.radius);
	}

	drawHours () {

		const TODAY = 0;
		const TOMORROW = 1;

		let skyEvents = new SkyEvents();

		let day = TODAY;
		let nightPM = TODAY;
		let nightAM = TODAY;

		if (skyEvents.sunIsUp()) {
			if (skyEvents.isItDSTTransitionTomorrow()) {
				nightAM = TOMORROW;
			} else if (!skyEvents.wasItDSTTransitionToday()) {
				return;
			}
		} else if (skyEvents.sunIsDownPM()) {
			if (skyEvents.isItDSTTransitionTomorrow()) {
				nightAM = TOMORROW;
				day = TOMORROW;
			} else {
				return;
			}
		}

		// TEMP: TODO how do we turn this data into hours to write
		// assume it's just a list of hours
		// array of numbers, index will helpfully be the position on the clock, value will be the hour to show



		for (let hour of qq('#HoursAndTicks text')) {
			hour.remove();
		}

		let r = .87 * this.radius,
			hoursAndTicks = qid('HoursAndTicks');

		// TEMP: this is where you got up to
		let dstChange = Dative.findTimeOfDSTChange(this.now());
		if (dstChange) {
			let amountOfClockToFuckUpInMilliseconds = dstChange.getTimezoneOffsetFromWinter());
		}

		let isDST = this.now().isDST(); // REVIEW: this needs to not fire if there's a dst transition nearby
		for (let h = 0; h < 24; h++) {
			let q = Time.getQForH(h, isDST),
				point = $number.polarToRect(r, q),
				hour = $dom.createElement(
				`<text
					x="${point.x}"
					y="${point.y}">
					${h}
				</text>`, 'svg');
			hoursAndTicks.appendChild(hour);
		}

	}

	drawTicks () {

		var s = .955,
			e = .985;

		var startRHour    = s * this.radius,
			startRHalf    = s * this.radius,
			startRQuarter = s * this.radius,

			endRHour      = e * this.radius,
			endRDefault   = e * this.radius,

			which = 60,

			hoursAndTicks = qid('HoursAndTicks');;

		for (let m = 0; m < 1440; m += 15) {

			let className, startR, endR;
			switch(which) {
				case 60 :
					className = 'hour';
					startR = startRHour;
					endR = endRHour;
					break;
				case 15 :
				case 45 :
					className = 'quarter';
					startR = startRQuarter;
					endR = endRDefault;
					break;
				case 30 :
					className = 'half';
					startR = startRHalf;
					endR = endRDefault;
					break;
			}

			let q = (m/15) * 3.75,
				end = $number.polarToRect(endR, q),
				start = $number.polarToRect(startR, q),
				tick = $dom.createElement(`<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" class="tick ${className}">`, 'svg');

			hoursAndTicks.appendChild(tick);

			which = (which == 60)
				? 15
				: which + 15;
		}

	}

	drawHand () {
		var hand = $dom.createElement(`<line x1="0" y1="0" x2="0" y2="${-.94 * this.radius}" id="HourHand" />`, 'svg');
		this.face.appendChild(hand);
	}

	static drawLocationSpecificDetails () {
		let clock = new Clock();
		SkyEvents.drawDaylightHours();
		SkyEvents.placeSun();
		SkyEvents.placeMoon();
		SkyEvents.drawMoonlightArc();
		SkyEvents.drawMoonlightBar();
		SkyEvents.changeMoonPhase();
		qid('MoonlightHours').classList.toggle(
			'transparent',
			!(clock.data.getItem('moonlightVisible'))
		);
		// dump('sun'); // DEBUG
	}

	static drawArc (start, end, id, now, accoutrements = false) {

		var clock = new Clock();

		start = new Dative(now).setTimeComponent(new Dative(start).toString('H:i:s.u'));
		end = new Dative(now).setTimeComponent(new Dative(end).toString('H:i:s.u'));

		if (start > end) {
			start = start.addDays(-1);
		}

		var radius = 1 * clock.radius,
			largeArcFlag = ((end - start) > (86400000 / 2)) ? 1 : 0,
			startPos = $number.polarToRect(radius, Time.asClockAngle(start)),
			endPos   = $number.polarToRect(radius, Time.asClockAngle(end)),
			path = `M ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y}`,
			arc = $dom.createElement(`<path d="${path}" id="${id}Arc">`, 'svg');

		if (accoutrements) {
			qid('Accoutrements').appendChild(arc);
		} else {
			clock.face.appendChild(arc);
		}

	}

	static drawLoadingSpinner () {

		var clock = new Clock();
		var la = $dom.createElement(
			`<circle cx="0" cy="0" r="${clock.radius * .70}" id="LoadingIndicator" class="hide"></circle>`, 'svg'
		);
		qid('Spinner').appendChild(la);

		setTimeout(function() {
			var la = qid('LoadingIndicator');
			if (la) {
				la.classList.remove('hide');
			}
			la.addEventListener('transitionend', function (la) {
				if (la && la.classList && la.classList.contains('hide')) {
					la.remove();
				}
			}, la);
		}, 0);

	}

	static removeLoadingSpinner () {
		var la = qid('LoadingIndicator');
		if (la) {
			la.classList.add('hide');
		}
	}

	debug () {
		if (!qid('DebugTime')) {
			document.body.appendChild($dom.createElement('<time id="DebugTime"></time>'));
		}
		this.globalVariables.setItem('debug', true);
		var moonStore = new LocalStorage('MOON');
		moonStore.clear();
	}

}

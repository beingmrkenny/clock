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
		this.globalVariables.setItem('now', new Dative(datetimeToShow));
	}

	tick () {

		var now = this.globalVariables.getItem('now');
		if (now) {
			this.setNow(now.addMilliseconds(1000));
		}

		this.showCurrentTime();
		this.showCurrentDate();

		var refreshSun = this.globalVariables.getItem('refreshSun'),
			refreshMoon = this.globalVariables.getItem('refreshMoon'),
			now = new Dative(this.now()).toString('Y-m-d H:i:s');

		if (this.globalVariables.getItem('debug')) {
			qid('DebugTime').textContent = new Dative(this.now()).toString('j M, H:i:s');
		}

		if (now == refreshSun) {
			SkyEvents.drawDaylightHours();
			SkyEvents.placeSun();
		}

		if (now == refreshMoon) {
			SkyEvents.placeMoon();
			SkyEvents.drawMoonlightArc();
		}

		if (qid('MoonlightBar')) {
			LocationService.execute(SkyEvents.updateMoonlightBar, true);
		}

	}

	start (dateTime) {

		var timer;

		this.stop();
		this.tick();
		timer = function () {
			var clock = new Clock();
			clock.tick();
		};

		this.globalVariables.setItem(
			'tickTimer',
			setInterval(timer, 1000) // COMBAK 1000
		);

		qid('HourHand').style.opacity = 1;
	}

	stop () {
		clearInterval(this.globalVariables.getItem('tickTimer'));
		qid('HourHand').style.opacity = 0.5;
	}

	showTime(dateTime) {
		var rotate = Time.asClockAngle(dateTime);
		qid('HourHand').setAttribute('transform', `rotate(${rotate})`);
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

	draw () {
		this.drawHours();
		this.drawTicks();
		this.drawHand();

		qid('Disc').setAttribute('r', this.radius);
	}

	drawHours () {

		var r = .87 * this.radius;

		for (let h = 0; h < 24; h++) {

			let q = Time.getQForH(h);

			let point = $number.polarToRect(r, q);

			let hour = $dom.createElement(
				`<text
					x="${point.x}"
					y="${point.y}">
					${h}
				</text>`, 'svg');

			this.face.appendChild(hour);

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

			which = 60;

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

			this.face.appendChild(tick);

			which = (which == 60)
				? 15
				: which + 15;
		}

	}

	drawHand () {
		var hand = $dom.createElement(`<line x1="0" y1="0" x2="0" y2="${-.94 * this.radius}" id="HourHand" />`, 'svg');
		this.face.appendChild(hand);
	}

	debug () {
		if (!qid('DebugTime')) {
			document.body.appendChild($dom.createElement('<time id="DebugTime"></time>'));
		}
		this.globalVariables.setItem('debug', true);
		var moonStore = new LocalStorage('MOON');
		moonStore.clear();
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

}

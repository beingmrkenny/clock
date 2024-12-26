// Draws the clock
// Manages time
// Manages data

class Clock {
	constructor() {
		this.svg = qid('ClockSVG');
		// NOTE: The compiler chokes on this and I don't want to define it all to hell in externs.js
		this.radius = this.svg.viewBox.baseVal.width * 0.2;
		this.face = qid('Face');
		this.data = new LocalStorage('CLOCK');
		this.globalVariables = new GlobalVariables('CLOCK');
	}

	// Time stuff

	now() {
		const now = new Dative(this.globalVariables.getItem('now') || null);
		now.setMilliseconds(0);
		return new Dative(now);
	}

	setNow(datetimeToShow) {
		this.globalVariables.setItem('now', new Dative(datetimeToShow));
	}

	tick() {
		let now = this.globalVariables.getItem('now') || new Dative();
		this.setNow(now.addMilliseconds(msAdvance));
		this.showCurrentTime();
		this.showCurrentDate();

		now = new Dative(this.now()).toString('Y-m-d H:i:s');

		if (this.globalVariables.getItem('debug')) {
			qid('DebugTime').textContent = new Dative(this.now()).toString(
				'j M, H:i:s P'
			);
		}

		if (now.endsWith("00:00:00")) {
			SkyEvents.placeSun();
			SkyEvents.drawDaylightHours();
			SkyEvents.placeMoon();
			SkyEvents.drawMoonlightArc();
			qid('Face').classList.toggle(
				'dst-rotated',
				this.now().isDST() || this.now().getTimezoneOffsetDifferenceBetweenAMAndPM() != 0
			);
		}

		// what is this plops?
		if (qid('MoonlightBar')) {
			LocationService.execute(SkyEvents.updateMoonlightBar, true);
		}
	}

	start() {
		this.stop();
		this.tick();
		const timer = function () {
			var clock = new Clock();
			clock.tick();
		};

		this.globalVariables.setItem('tickTimer', setInterval(timer, msInterval));

		qid('HourHand').style.opacity = 1;
	}

	stop() {
		clearInterval(this.globalVariables.getItem('tickTimer'));
		qid('HourHand').style.opacity = 0.5;
	}

	showTime(dateTime) {
		const angle = Time.asClockAngle(dateTime);
		qid('HourHand').setAttribute('transform', `rotate(${angle})`);
	}

	showCurrentTime() {
		this.showTime(this.now());
	}

	showCurrentDate() {
		const actualNow = new Dative(),
			now = new Dative(this.now()),
			dateComplication = q('#Date');
		let format = 'D j';

		format += actualNow.toString('Y-m') != now.toString('Y-m') ? ' M' : '';
		format += actualNow.getFullYear() != now.getFullYear() ? ' Y' : '';

		dateComplication.textContent = now.toString(format);
	}

	// Drawing stuff

	draw() {
		this.drawHours();
		this.drawTicks();
		this.drawHand();

		qid('Disc').setAttribute('r', this.radius);
		qid('Face').classList.toggle(
			'dst-rotated',
			this.now().isDST() ||
				this.now().getTimezoneOffsetDifferenceBetweenAMAndPM() != 0
		);
	}

	drawHours() {
		const r = 1.1 * this.radius,
			hoursAndTicks = qid('HoursAndTicks');
		for (let h = 0; h < 24; h++) {
			let q = (h < 12 ? h + 12 : h - 12) * 15,
				point = polarToRect(r, q),
				hour = createElement(
					`<text
					x="${point.x}"
					y="${point.y}"
					transform="rotate(${q}, ${point.x}, ${point.y})">
					${h}
				</text>`,
					'svg'
				);
			hoursAndTicks.appendChild(hour);
		}
	}

	drawTicks() {
		const minutesPerTick = 10,
			minutesIn24Hours = 1440,
			numberOfTicks = minutesIn24Hours / minutesPerTick,
			anglePerTick = 360 / numberOfTicks,
			radius = 0.930 * this.radius; // larger is further towards the outside

		let which = 60,
			hoursAndTicks = qid('HoursAndTicks');

		// m = minute
		for (let m = 0; m < 1440; m += minutesPerTick) {
			let className, rAttr;
			switch (which) {
				case 60:
					className = 'hour';
					rAttr = 2;
					break;
				case 30:
					className = 'half';
					rAttr = 1;
					break;
				case 10:
				case 20:
				case 40:
				case 50:
					className = 'quarter';
					rAttr = 1;
					break;
			}

			let q = (m / minutesPerTick) * anglePerTick,
				position = polarToRect(radius, q),
				tick = createElement(
					`<circle cx="${position.x}" cy="${position.y}" r="${rAttr}" class="tick ${className}">`,
					'svg'
				);

			hoursAndTicks.appendChild(tick);

			which = which == 60 ? minutesPerTick : which + minutesPerTick;
		}
	}

	drawHand() {
		this.face.appendChild(
			createElement(
				`<line x1="0" y1="0" x2="0" y2="${
					-0.85 * this.radius
				}" id="HourHand" />`,
				'svg'
			)
		);
	}

	static drawLocationSpecificDetails() {
		let clock = new Clock();
		SkyEvents.drawDaylightHours();
		SkyEvents.placeSun();
		SkyEvents.placeMoon();
		SkyEvents.drawMoonlightArc();
		SkyEvents.drawMoonlightBar();
		SkyEvents.changeMoonPhase();
		qid('MoonlightHours').classList.toggle(
			'transparent',
			!clock.data.getItem('moonlightVisible')
		);
	}

	static drawArc(start, end, id) {
		const clock = new Clock();

		start = new Dative().setTimeComponent(
			new Dative(start).toString('H:i:s.u')
		);
		end = new Dative().setTimeComponent(new Dative(end).toString('H:i:s.u'));

		if (start > end) {
			start = start.addDays(-1);
		}

		const radius = 1 * clock.radius,
			largeArcFlag = end - start > 86400000 / 2 ? 1 : 0,
			startPos = polarToRect(radius, Time.asClockAngle(start)),
			endPos = polarToRect(radius, Time.asClockAngle(end)),
			path = `M ${startPos.x},${startPos.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endPos.x},${endPos.y}`,
			arc = createElement(`<path d="${path}" id="${id}Arc">`, 'svg');

		clock.face.appendChild(arc);

	}

	static drawLoadingSpinner() {
		const clock = new Clock(),
			la = createElement(
				`<circle cx="0" cy="0" r="${
					clock.radius * 0.7
				}" id="LoadingIndicator" class="hide"></circle>`,
				'svg'
			);
		qid('Spinner').appendChild(la);

		setTimeout(function () {
			const la = qid('LoadingIndicator');
			if (la) {
				la.classList.remove('hide');
			}
			la.addEventListener(
				'transitionend',
				function (la) {
					if (la && la.classList && la.classList.contains('hide')) {
						la.remove();
					}
				},
				la
			);
		}, 0);
	}

	static removeLoadingSpinner() {
		const la = qid('LoadingIndicator');
		if (la) {
			la.classList.add('hide');
		}
	}

	debug() {
		if (!qid('DebugTime')) {
			document.body.appendChild(createElement('<time id="DebugTime"></time>'));
		}
		this.globalVariables.setItem('debug', true);
		const moonStore = new LocalStorage('MOON');
		moonStore.clear();
	}
}

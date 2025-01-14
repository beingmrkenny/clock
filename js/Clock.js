// Draws the clock
// Manages time
// Manages data

class Clock {
	constructor() {
		this.svg = qid('ClockSVG');
		// NOTE: The compiler chokes on this and I don't want to define it all to hell in externs.js
		this.radius = this.svg.viewBox.baseVal.width * 0.37;
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

		if (now.endsWith('00:00:00')) {
			SkyEvents.placeSun();
			SkyEvents.drawDaylightHours();
			SkyEvents.placeMoon();
			SkyEvents.drawMoonlightArc();
			qid('Face').classList.toggle(
				'dst-rotated',
				this.now().isDST() ||
					this.now().getTimezoneOffsetDifferenceBetweenAMAndPM() != 0
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

		qid('TimeGroup').style.opacity = 1;
	}

	stop() {
		clearInterval(this.globalVariables.getItem('tickTimer'));
		qid('TimeGroup').style.opacity = 0.5;
	}

	showTime(dateTime) {
		const angle = Time.asClockAngle(dateTime);
		qid('TimeGroup').setAttribute('transform', `rotate(${angle})`);
	}

	showCurrentTime() {
		this.showTime(this.now());
		qid('Time').textContent = this.now().toString('H:i');
	}

	showCurrentDate() {
		const actualNow = new Dative(),
			now = new Dative(this.now());
		let format = 'D j';

		format += actualNow.toString('Y-m') != now.toString('Y-m') ? ' M' : '';
		format += actualNow.getFullYear() != now.getFullYear() ? ' Y' : '';

		qid('Date').textContent = now.toString(format);
	}

	// Drawing stuff

	draw() {
		this.drawHours();
		this.drawTicks();
		this.drawHands();
		this.drawCalendar();

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
					class="hour-digit"
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
			radius = 0.93 * this.radius; // larger is further towards the outside

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

	drawHands() {
		this.showCurrentTime();
		this.showCurrentDate();

		const now = this.now();

		const summer = new Dative(A.Get.summerSolstice(now.format('Y')));
		const winter = new Dative(A.Get.winterSolstice(now.format('Y')));

		['Time', 'Date'].forEach((type) => {
			const side =
				type == 'Time'
					? now.format('H') <= 11
						? 'left'
						: 'right'
					: now <= summer || now >= winter
						? 'left'
						: 'right';

			const proportion = type == 'Time' ? -0.89 : -0.8,
				radius = proportion * this.radius,
				x = side == 'left' ? -0.4 : 0.4, // x is clockwise/anti-clockwise on the hand
				y = radius / 2, // y is from center to perimeter
				angle = side == 'left' ? 90 : -90;

				// placeDot(x, 10, qid(type + 'Group'));

			const text = qid(type);
			text.setAttribute('x', x);
			text.setAttribute('y', y);
			text.setAttribute('transform', `rotate(${angle}, ${x}, ${y})`);

			const mask = qid(type + 'Mask'),
				halfWidth = text.getBBox().width / 2;
			mask.setAttribute('y1', y - halfWidth);
			mask.setAttribute('y2', y + halfWidth);

			qid(type + 'Hand').setAttribute('y2', radius);
		});
	}

	drawCalendar() {
		const radius = 0.86 * this.radius,
			year = this.now().format('Y'),
			numberOfDays = year % 4 == 0 ? 366 : 365,
			anglePerDay = 360 / numberOfDays,
			calendar = qid('Calendar');

		const winterSolstice = new Dative(A.Get.winterSolstice(year)),
			winter = winterSolstice.format('Y-m-d'),
			spring = new Dative(A.Get.vernalEquinox(year)).format('Y-m-d'),
			summer = new Dative(A.Get.summerSolstice(year)).format('Y-m-d'),
			autumn = new Dative(A.Get.fallEquinox(year)).format('Y-m-d'),
			today = this.now().format('Y-m-d');

		let currentDay = new Dative(winterSolstice);
		for (let i = 1; i <= numberOfDays; i++) {
			const angle = 180 - anglePerDay + i * anglePerDay,
				c = polarToRect(radius, angle),
				classList = [],
				currentDate = currentDay.format('Y-m-d');

			let dotR = 0.5,
				ringR = 2,
				ring = false;

			classList.push(currentDay.format('F').toLowerCase());

			if (currentDay.getDate() == 1) {
				classList.push('first');
				ringR = 2;
				dotR = 2;
			}

			if (currentDate == today) {
				qid('DateGroup').setAttribute('transform', `rotate(${angle}, 0, 0)`);
				classList.push('today');
				ring = true;
			} else {
				if (currentDay < this.now()) classList.push('past');
				if (currentDay > this.now()) classList.push('future');
			}

			if (currentDate == winter) {
				classList.push('solar-point', 'winter-solstice');
				ringR = 3;
				ring = true;
			}
			if (currentDate == summer) {
				classList.push('solar-point', 'summer-solstice');
				ringR = 3;
				ring = true;
			}
			if (currentDate == spring) {
				classList.push('solar-point', 'spring-equinox');
				ringR = 3;
				ring = true;
			}
			if (currentDate == autumn) {
				classList.push('solar-point', 'autumn-equinox');
				ringR = 3;
				ring = true;
			}

			if (ring) {
				calendar.prepend(
					createElement(
						`<circle cx="${c.x}" cy="${
							c.y
						}" r="${ringR}" class="ring ${classList.join(' ')}">`,
						'svg'
					)
				);
			}

			calendar.appendChild(
				createElement(
					`<circle cx="${c.x}" cy="${
						c.y
					}" r="${dotR}" class="dot ${classList.join(
						' '
					)}" data-date="${currentDate}">`,
					'svg'
				)
			);

			if (currentDay.format('m-d') == '12-31') {
				currentDay = new Dative('1 Jan ' + year);
			} else {
				currentDay = currentDay.addDays(1);
			}
		}
	}

	static drawLocationSpecificDetails() {
		let clock = new Clock();
		SkyEvents.drawDaylightHours();
		SkyEvents.placeSun();
		SkyEvents.placeMoon();
		SkyEvents.drawMoonlightArc();
		SkyEvents.drawMoonlightBar();
		SkyEvents.changeMoonPhase();
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

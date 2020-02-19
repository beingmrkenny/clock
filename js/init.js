const dateTimeDebug = '2020-03-29 19:50:50';
// const dateTimeDebug = '2020-03-29 00:55:50'; // go forward (DST) fucked up sunrise, on both sides of the DST deadline

// const dateTimeDebug = '2020-03-29 10:59:56'; // go forward (DST) fucked up noon
// const dateTimeDebug = '2020-03-29 10:59:56'; // go forward (DST) fucked up sunset — when I first did this, it was this

// const dateTimeDebug = '2020-03-29 18:50:56'; // go forward (DST) fucked up time
// const dateTimeDebug = '2020-03-29 18:50:56'; // go forward (DST) fucked up sunset - time wrong too — when I first did this, it was this

// const dateTimeDebug = '2020-03-29 20:50:56'; // go forward (DST) fucked up sunset - time wrong too
// const dateTimeDebug = '2020-03-29 22:50:56'; // go forward (DST) fucked up sunset - time wrong too
// const dateTimeDebug = '2020-03-29 23:00:00'; // go forward (DST) all good
// const dateTimeDebug = '2020-03-30 00:59:56'; // go forward (DST) fucked up both
// const dateTimeDebug = '2020-03-30 10:59:56'; // go forward (DST) all good
// const dateTimeDebug = '2020-03-30 19:50:56'; // go forward (DST) all good

// const dateTimeDebug = '2020-03-28 00:59:56'; // go forward (DST) day before, all good
// const dateTimeDebug = '2020-03-31 00:59:56'; // go forward (DST) day after, all good

// const dateTimeDebug = '2020-10-24 00:59:56'; // go backwards (GMT) day before, all good
// const dateTimeDebug = '2020-10-25 00:59:56'; // go backwards (GMT) fucked up sunrise
// const dateTimeDebug = '2020-10-26 00:59:56'; // go backwards (GMT) fucked up sunrise
// const dateTimeDebug = '2020-10-27 00:59:56'; // go backwards (GMT) day after, all good

// const dateTimeDebug = '2020-01-25 00:59:56'; // winter (GMT)
// const dateTimeDebug = '2020-06-25 00:59:56'; // summer (DST)

// const dateTimeDebug = false; // full date time
const timeDebug = false; // use today, but change the time
const msAdvance = 1000; // each tick advances the time by this much
const msInterval = 1000; // how often should each tick happen
const debuggery = true;

document.addEventListener('DOMContentLoaded', function () {

	document.body.classList.toggle('debuggery', debuggery);

	var clock = new Clock();
	clock.globalVariables.setItem('thatDSTOffset', clock.now().getTimezoneOffsetFromWinter());

	if (dateTimeDebug) {
		clock.setNow(dateTimeDebug);
		clock.debug();
	}

	if (timeDebug) {
		let now = new Dative();
		now.setTimeComponent(timeDebug);
		clock.setNow(now);
		clock.debug();
	}

	clock.draw();

	clock.start();

	LocationService.execute(Clock.drawLocationSpecificDetails);

	qid('Moon').addEventListener('click', function () {
		let moonlightHours = qid('MoonlightHours'),
			clock = new Clock(),
			toggle = !(moonlightHours.classList.contains('transparent'));
		qid('MoonlightHours').classList.toggle('transparent', toggle);
		clock.data.setItem('moonlightVisible', toggle);
	});

	if (!clock.now().isWeekend()) {
		Clock.drawArc('09.00', '17.30', 'Work', clock.now(), true);
	}

	qid('Cog').addEventListener('click', function () {
		var ls = new LocalStorage('CLOCK');
		ls.delete('location');
		LocationService.execute(Clock.drawLocationSpecificDetails);
	});

	// DEBUG: debuggery
	// QUESTION: Does this fix the issue where the moon bar is fucked?
	// QUESTION: Does this need rate limiting or something, so only refresh if it was in the last 15 mins
	// document.addEventListener('visibilitychange', function () {
	// 	if (!document.hidden) {
	// 		LocationService.execute(Clock.drawLocationSpecificDetails);
	// 	}
	// });

});

const dateTimeDebug = '31 march 2024 00:15'; // full date time
// const dateTimeDebug = '27 October 2024 00:00'; // full date time
// const dateTimeDebug = '3 august 2024 00:00'; // full date time
// const dateTimeDebug = '3 november 2024 00:00'; // full date time
const timeDebug = false; // use today, but change the time
const msAdvance = 1000; // each tick advances the time by this much
const msInterval = 1000; // how often should each tick happen

document.addEventListener('DOMContentLoaded', function () {

	var clock = new Clock();

	if (dateTimeDebug) {
		clock.setNow(dateTimeDebug);
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
		Clock.drawArc('09.00', '17.30', 'Work', true);
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

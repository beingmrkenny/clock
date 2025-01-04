const dateTimeDebug = false; // full date time

// const dateTimeDebug = '22 December 2024 00:15';
// const dateTimeDebug = '1 Mar 2024 00:15';

// const dateTimeDebug = '28 march 2024 00:15'; // spring forward - 3
// const dateTimeDebug = '29 march 2024 00:15'; // spring forward - 2
// const dateTimeDebug = '30 march 2024 00:15'; // spring forward - 1
// const dateTimeDebug = '31 march 2024 00:15'; // spring forward
// const dateTimeDebug = '1 april 2024 00:15'; // spring forward + 1
// const dateTimeDebug = '2 april 2024 00:15'; // spring forward + 2
// const dateTimeDebug = '3 april 2024 00:15'; // spring forward + 3

// const dateTimeDebug = '24 October 2024 00:15'; // fall back -3
// const dateTimeDebug = '25 October 2024 00:15'; // fall back -2
// const dateTimeDebug = '26 October 2024 00:15'; // fall back -1
// const dateTimeDebug = '27 October 2024 00:15'; // fall back
// const dateTimeDebug = '28 October 2024 00:15'; // fall back + 1
// const dateTimeDebug = '29 October 2024 00:15'; // fall back + 2
// const dateTimeDebug = '30 October 2024 00:15'; // fall back + 3

// const dateTimeDebug = '3 august 2024 00:00'; // summer (DST)
// const dateTimeDebug = '3 november 2024 00:00'; // winter (no DST)
// const dateTimeDebug = '23 december 2024 00:00'; // winter (no DST)

const timeDebug = false; // use today, but change the time
// const timeDebug = "00:00:00"; // use today, but change the time
const msAdvance = 1000; // each tick advances the time by this much
const msInterval = 1000; // how often should each tick happen
// const msAdvance = 60000; // each tick advances the time by this much
// const msInterval = 20; // how often should each tick happen

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
			toggle = !moonlightHours.classList.contains('transparent');
		moonlightHours.classList.toggle('transparent', toggle);
		setTimeout(() => {
			qid('MoonlightHours').classList.add('transparent');
		}, 7000);
	});

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

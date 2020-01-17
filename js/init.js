document.addEventListener('DOMContentLoaded', function () {

	var clock = new Clock();

	clock.draw();
	// NOTE Set now here to test different times
	// clock.setNow('2017-12-14 06:10:40');
	// clock.debug();
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

});

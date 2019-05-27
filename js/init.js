$.ready().then(function () {

	var clock = new Clock();

	clock.draw();
	// NOTE Set now here to test different times
	// clock.setNow('2017-12-14 06:10:40');
	// clock.debug();
	clock.start();

	LocationService.execute(function () {
		var clock = new Clock();
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
	});

	qid('Moon').addEventListener('click', function () {
		var moonlightHours = qid('MoonlightHours'),
			clock = new Clock(),
			toggle = !(moonlightHours.classList.contains('transparent'));
		qid('MoonlightHours').classList.toggle('transparent', toggle);
		clock.data.setItem('moonlightVisible', toggle);
	});

});

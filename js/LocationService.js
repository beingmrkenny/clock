
class LocationService {

	static execute (action, suppressPermissionRequest=false) {

		if (LocationService.haveLocation()) {

			action();

		} else if (!suppressPermissionRequest) {

			if (LocationService.havePermission()) {
				LocationService.getLocation(action);
			} else {
				LocationService.getPermission(action);
			}

		}

	}

	static haveLocation () {
		var clock = new Clock();
		var location = clock.data.getItem('location');
		return (location);
	}

	static havePermission () {
		var clock = new Clock();
		var permission = clock.data.getItem('havePermission');
		return (permission);
	}

	static getPermission (action) {

		new Dialog (
			'Location Permission',
			'Your location is needed to work out sun and moon times. Location data is stored locally on your device and is never sent anywhere else.',
			function () {
				var clock = new Clock();
				clock.data.setItem('havePermission', true);
				LocationService.getLocation (action);
			}
		);

	}

	static getLocation (action) {

		Clock.drawLoadingSpinner();

		navigator.geolocation.getCurrentPosition(function(position) {

			var clock = new Clock();

			clock.data.setItem('location', {
				longitude : position.coords.longitude,
				latitude : position.coords.latitude
			});

			action();

			setTimeout(Clock.removeLoadingSpinner, 0);

		});

	}

}

function degreesToPolar(deg) {
	let polar = 360 - (deg - 90);

	if (polar >= 360) {
		polar -= 360;
	} else if (polar < 0) {
		polar += 360;
	}

	return polar;
}

function polarToRect(radius, angle) {
	// NOTE In polar coords, 0° is at the 3 o'clock position, and angles go counter-clockwise
	// angle must be given according to that system

	angle = degreesToPolar(angle);

	const radians = -angle * (Math.PI / 180),
		x = radius * Math.cos(radians),
		y = radius * Math.sin(radians);

	return {
		x: x.toFixed(10),
		y: y.toFixed(10),
	};
}

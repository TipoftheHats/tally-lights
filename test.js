'use strict';

const tessel = require('tessel');

function readAllPins() {
	console.log('Reading all pins...');
	for (const portName in tessel.port) {
		const port = tessel.port[portName];
		port.pin.forEach((pin, pinIndex) => {
			pin.read((error, value) => {
				if (error) {
					console.error('Failed to read pin:', error);
				} else {
					console.log(`Port ${portName}, pin #${pinIndex}: ${value}`)
				}
			});
		});
	}
}

let lastValue = 0;
function writeToOnePin() {
	const newValue = lastValue === 0 ? 1 : 0;
	tessel.port.A.pin[0].write(newValue, (error => {
		if (error) {
			console.error('Failed to write pin:', error);
		} else {
			console.log(`Successfully wrote ${newValue} to pin`);
		}
	}));
	lastValue = newValue;
}

setInterval(() => {
	readAllPins()
}, 3000);

setInterval(() => {
	writeToOnePin();
}, 1000);

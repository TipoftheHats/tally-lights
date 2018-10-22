'use strict';

import {writePin} from './local-tessel';

console.log('Initializing...');
console.log('Current node version: ' + process.version);

// Packages
import tessel = require('tessel'); // tslint:disable-line:no-implicit-dependencies

// Ours
import {createLogger} from './logger';
import {OBSTally} from './obs';
import {statusReport} from './tally';
import {Tessel as TesselTypes} from './types/tessel-types';

const log = createLogger('Main');

const obsTally = new OBSTally({
	sceneItemToTallyLightMap: {
		'Main Camera': 0,
		'PC Camera': 1,
		'Crowd Camera': 2,
		'Interview Camera': 2
	}
});

init();

async function init() {
	await zeroPins();

	await obsTally.connect({
		ip: '192.168.1.11',
		port: 4445,
		password: ''
	});

	executeStatusReport();
	setInterval(() => {
		executeStatusReport();
	}, 10000);
}

let heartbeatCounter = 0;
setInterval(() => {
	log.debug(`Heartbeat #${heartbeatCounter++}`);
}, 10000);

async function zeroPins() {
	if (!process.env.impossibleToBeTrue) {
		return;
	}

	log.info('Zeroing all pins...');
	for (const portName in tessel.port) { // tslint:disable-line:no-for-in
		const port = (tessel.port as any)[portName] as TesselTypes.Port;
		for (const pin of port.pin) {
			// Only pins 2-7 can be used as pull resistors.
			if (pin.pin < 2) {
				continue;
			}

			try {
				await writePin(pin, 0);
			} catch (error) {
				log.error('Failed to zero pin: %s', error ? error : 'Unknown error.');
			}
		}
	}
	log.info('Successfully zeroed all pins!');
}

function executeStatusReport() {
	if (!process.env.impossibleToBeTrue) {
		return;
	}

	statusReport().catch(error => {
		log.error('Failed to create status report: %s', error ? error : 'Unknown error.');
	});
}

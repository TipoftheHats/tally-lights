'use strict';

console.log('Initializing...');
console.log('Current node version: ' + process.version);

// Native
import tessel = require('tessel'); // tslint:disable-line:no-implicit-dependencies

// Packages
import * as Sentry from '@sentry/node';

// Ours
import {createLogger} from './logger';
import {statusReport} from './tally';
import {ATEMTally} from './atem';
import config from './config';
import {writePin} from './local-tessel';

if (config.get('sentry.enabled')) {
	Sentry.init({
		dsn: config.get('sentry.dsn')
	});
}

const log = createLogger('Main');

const atemTally = new ATEMTally({
	inputToTallyLightMap: {
		1: 0,
		2: 1,
		3: 2,
		4: 3,
		5: 4,
		6: 5
	}
});

init().then(() => {
	log.info('Initialization successful!');
}).catch(error => {
	log.error('Initialization failed:', error);
});

async function init() {
	await zeroPins();

	await atemTally.connect({ip: config.get('atemIp')});

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
	log.info('Zeroing all pins...');
	for (const portName in tessel.port) { // tslint:disable-line:no-for-in
		const port = tessel.port[portName as 'A' | 'B'];
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

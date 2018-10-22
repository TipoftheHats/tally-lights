'use strict';

console.log('Initializing...');
console.log('Current node version: ' + process.version);

// Ours
import {createLogger} from './logger';
import {OBSTally} from './obs';
import {statusReport} from './tally';

const log = createLogger('Main');

const obsTally = new OBSTally({
	sceneItemToTallyLightMap: {
		'Main Camera': 0,
		'PC Camera': 1,
		'Crowd Camera': 2,
		'Interview Camera': 2
	}
});

obsTally.connect({
	ip: '192.168.1.11',
	port: 4445,
	password: ''
});

executeStatusReport();
setInterval(() => {
	executeStatusReport();
}, 10000);

function executeStatusReport() {
	statusReport().catch(error => {
		log.error('Failed to create status report: %s', error ? error : 'Unknown error.');
	});
}

console.log('Initializing...');
console.log('Current node version: ' + process.version);

// Packages
import * as Sentry from '@sentry/node';

// Ours
import { createLogger } from '../common/logger';
import { ATEMTally } from './atem';
import { OBSTally } from './obs';
import config from '../common/config';
import { lightServer } from './server';

if (config.get('sentry.enabled')) {
	Sentry.init({
		dsn: config.get('sentry.dsn'),
	});
}

const log = createLogger('Main');

init()
	.then(() => {
		log.info('Initialization successful!');
	})
	.catch(error => {
		log.error('Initialization failed:', error?.message);
	});

async function init(): Promise<void> {
	const mode = config.get('mode');
	if (mode === 'atem') {
		log.info('Connecting to ATEM at %s', config.get('atem').ip);
		const atemTally = new ATEMTally({
			inputToTallyLightMap: config.get('atem').tallyMapping,
		});
		atemTally.on('update', newState => {
			lightServer.emit('setTally', newState);
		});
		await atemTally.connect(config.get('atem'));
	} else if (mode === 'obs') {
		log.info('Connecting to OBS at %s:%s', config.get('obs').ip, config.get('obs').port);
		const obsTally = new OBSTally({
			sceneItemToTallyLightMap: config.get('obs').tallyMapping,
		});
		obsTally.on('update', newState => {
			lightServer.emit('setTally', newState);
		});
		await obsTally.connect(config.get('obs'));
	} else {
		throw new Error(`unknown mode "${mode}"`);
	}
}

let heartbeatCounter = 0;
setInterval(() => {
	log.debug(`Heartbeat #${heartbeatCounter++}`);
}, 10000);

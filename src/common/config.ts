// Native
import * as fs from 'fs';
import * as path from 'path';
import * as convict from 'convict';

// Ours
import { createLogger } from './logger';

const log = createLogger('config');
const conf = convict({
	mode: {
		doc: 'The tally mode to use. Mostly determines what the source of data is.',
		format: ['atem', 'obs'],
		default: 'atem',
		env: 'TALLY_MODE',
	},
	baseStation: {
		ip: {
			doc: 'The IP address of the base station, so that the lights know where to find it.',
			format: 'ipaddress',
			default: '172.16.0.1',
			env: 'BASE_STATION_IP',
		},
		port: {
			doc: 'The port that the base station binds to, so that the lights know where to find it.',
			format: 'port',
			default: 3000,
			env: 'BASE_STATION_PORT',
		},
	},
	light: {
		channel: {
			doc: 'What channel this light should react to.',
			format: Number,
			default: 0,
			env: 'LIGHT_CHANNEL',
		},
		previewBrightness: {
			doc: 'How bright to make the preview light [0-255].',
			format: Number,
			default: 100,
			env: 'PREVIEW_BRIGHTNESS',
		},
		programBrightness: {
			doc: 'How bright to make the program light [0-255].',
			format: Number,
			default: 100,
			env: 'PROGRAM_BRIGHTNESS',
		},
	},
	atem: {
		ip: {
			doc: 'The IP address of the ATEM.',
			format: 'ipaddress',
			default: '192.168.1.5',
			env: 'ATEM_IP',
		},
		tallyMapping: {
			doc: 'How to map ATEM inputs to tally channels.',
			format(val) {
				if (typeof val !== 'object') {
					throw new TypeError('must be an object');
				}

				if (
					!Object.keys(val).every(k => {
						if (typeof k === 'number') {
							return true;
						}

						const parsed = parseInt(k, 10);
						return !isNaN(parsed);
					})
				) {
					throw new TypeError('all keys must be numbers');
				}

				if (!Object.values(val).every(v => typeof v === 'number')) {
					throw new TypeError('all values must be numbers');
				}
			},
			default: {
				1: 0,
				2: 1,
				3: 2,
				4: 3,
				5: 4,
				6: 5,
				7: 6,
				8: 7,
			},
		},
	},
	obs: {
		ip: {
			doc: 'The IP address of an OBS instance.',
			format: 'ipaddress',
			default: '10.1.250.6',
			env: 'OBS_IP',
		},
		port: {
			doc: 'The port that obs-websocket is listening on.',
			format: 'port',
			default: 4444,
			env: 'OBS_PORT',
		},
		password: {
			doc: 'The password that obs-websocket is configured to use.',
			format: String,
			default: '',
			env: 'OBS_PASSWORD',
		},
		tallyMapping: {
			doc: 'How to map OBS scene items to tally channels.',
			format(val) {
				if (typeof val !== 'object') {
					throw new TypeError('must be an object');
				}

				if (!Object.keys(val).every(k => typeof k === 'string')) {
					throw new TypeError('all keys must be strings');
				}

				if (!Object.values(val).every(v => typeof v === 'number')) {
					throw new TypeError('all values must be numbers');
				}
			},
			default: {
				'Camera 1': 0,
				'Camera 2': 1,
				'Camera 3': 2,
				'Camera 4': 3,
				'Camera 5': 4,
				'Camera 6': 5,
				'Camera 7': 6,
				'Camera 8': 7,
			},
		},
	},
	sentry: {
		enabled: {
			doc: 'Whether or not to enable Sentry error reporting.',
			format: Boolean,
			default: true,
			env: 'SENTRY_ENABLED',
		},
		dsn: {
			doc: 'A Sentry project DSN.',
			format: String,
			default: '',
			env: 'SENTRY_DSN',
		},
	},
});

const configPath = path.join(__dirname, '../../config.json');
if (fs.existsSync(configPath) && process.env.NODE_ENV !== 'test') {
	log.info('Loading config from file.');
	conf.loadFile(configPath);
} else {
	log.warn('No config found, using defaults and env vars.');
}

// Perform validation
conf.validate({ allowed: 'strict' });

export default conf;

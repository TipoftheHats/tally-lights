import * as fs from 'fs';
import * as convict from 'convict';

const conf = convict({
	mode: {
		doc: 'The tally mode to use. Mostly determines what the source of data is.',
		format: ['atem', 'obs'],
		default: 'atem',
		env: 'TALLY_MODE'
	},
	atemIp: {
		doc: 'The IP address of the ATEM.',
		format: 'ipaddress',
		default: '192.168.1.50',
		env: 'ATEM_IP'
	},
	obsIp: {
		doc: 'The IP address of an OBS instance.',
		format: 'ipaddress',
		default: '10.1.250.6',
		env: 'OBS_IP'
	},
	sentry: {
		enabled: {
			doc: 'Whether or not to enable Sentry error reporting.',
			format: Boolean,
			default: true,
			env: 'SENTRY_ENABLED'
		},
		dsn: {
			doc: 'A Sentry project DSN.',
			format: String,
			default: '',
			env: 'SENTRY_DSN'
		}
	}
});

if (fs.existsSync('./config.json') && process.env.NODE_ENV !== 'test') {
	conf.loadFile('./config.json');
}

// Perform validation
conf.validate({allowed: 'strict'});

export default conf;

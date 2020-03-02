// Packages
import * as io from 'socket.io-client';

// Ours
import { TypedLightClient } from '../types/socket-protocol';
import { init as initBoard, setBrightness, turnOn, turnOff } from './board';
import { createLogger } from '../common/logger';
import config from '../common/config';

const log = createLogger('socket');
const host = `http://${config.get('baseStation').ip}:${config.get('baseStation').port}`;
const ns = '/light';

initBoard()
	.then(() => {
		const client: TypedLightClient = io(host + ns) as any;

		client.on('setBrightness', ({ preview, program }) => {
			log.info('setBrightness | preview: %s, program: %s', preview, program);
			setBrightness('preview', preview);
			setBrightness('program', program);
		});

		client.on('setTally', newStates => {
			if (!newStates || !Array.isArray(newStates)) {
				return;
			}

			newStates.forEach(({ channel, state }) => {
				if (channel !== config.get('light').channel) {
					return;
				}

				log.info('setTally | %s', state);
				if (state === 'preview') {
					turnOn('preview');
					turnOff('program');
				} else if (state === 'program') {
					turnOff('preview');
					turnOn('program');
				} else {
					turnOff('preview');
					turnOff('program');
				}
			});
		});
	})
	.catch(error => {
		log.error('Failed to init:', error);
	});

let heartbeatCounter = 0;
setInterval(() => {
	log.debug(`Heartbeat #${heartbeatCounter++}`);
}, 10000);

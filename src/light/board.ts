// Packages
import J5Raspi = require('raspi-io');
import * as five from 'johnny-five';

// Ours
import { createLogger } from '../common/logger';

const log = createLogger('board');

let initialized = false;
let preview: five.Led;
let program: five.Led;

export async function init(): Promise<void> {
	if (initialized) {
		return;
	}

	return new Promise(resolve => {
		log.info('Preparing board...');
		const board = new five.Board({
			io: new J5Raspi.RaspiIO(),
		});

		board.on('ready', () => {
			initialized = true;
			log.info('Board ready!');
			preview = new five.Led('PWM0' as any);
			program = new five.Led('PWM1' as any);
			preview.off();
			program.off();
			resolve();
		});

		board.on('exit', () => {
			log.info('Cleaning up for exit...');
			if (preview) {
				preview.off();
			}

			if (program) {
				program.off();
			}

			log.info('Cleaning up complete!');
		});
	});
}

export function setBrightness(channel: 'program' | 'preview', brightness: number): void {
	if (!initialized) {
		throw new Error('board not initialized');
	}

	const pin = channel === 'program' ? program : preview;
	return pin.brightness(brightness);
}

export function turnOn(channel: 'program' | 'preview'): void {
	if (!initialized) {
		throw new Error('board not initialized');
	}

	const pin = channel === 'program' ? program : preview;
	return pin.on();
}

export function turnOff(channel: 'program' | 'preview'): void {
	if (!initialized) {
		throw new Error('board not initialized');
	}

	const pin = channel === 'program' ? program : preview;
	return pin.off();
}

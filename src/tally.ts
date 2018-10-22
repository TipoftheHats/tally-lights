'use strict';

// Native
import tessel = require('tessel'); // tslint:disable-line:no-implicit-dependencies

// Ours
import {createLogger} from './logger';
import {Tessel as TesselTypes} from './types/tessel-types';

const log = createLogger('Tally');

export const enum TALLY_STATE {
	NONE = 0,
	PROGRAM = 1,
	PREVIEW = 2
}

const PIN_MAPPING = {
	// Port A
	0: tessel.port.A.pin[0],
	1: tessel.port.A.pin[1],
	2: tessel.port.A.pin[2],
	3: tessel.port.A.pin[3],
	4: tessel.port.A.pin[4],
	5: tessel.port.A.pin[5],
	6: tessel.port.A.pin[6],
	7: tessel.port.A.pin[7],

	// Port B
	8: tessel.port.B.pin[0],
	9: tessel.port.B.pin[1],
	10: tessel.port.B.pin[2],
	11: tessel.port.B.pin[3],
	12: tessel.port.B.pin[4],
	13: tessel.port.B.pin[5],
	14: tessel.port.B.pin[6],
	15: tessel.port.B.pin[7],
};

const TALLY_MAPPING = {
	0: [PIN_MAPPING[0], PIN_MAPPING[1]], // tallyLightIndex: [PGM_PIN, PVW_PIN]
	1: [PIN_MAPPING[2], PIN_MAPPING[3]],
	2: [PIN_MAPPING[4], PIN_MAPPING[5]],
	3: [PIN_MAPPING[6], PIN_MAPPING[7]],
	4: [PIN_MAPPING[8], PIN_MAPPING[9]],
	5: [PIN_MAPPING[10], PIN_MAPPING[11]],
	6: [PIN_MAPPING[12], PIN_MAPPING[13]],
	7: [PIN_MAPPING[14], PIN_MAPPING[15]],
} as {
	[k: number]: [TesselTypes.Pin, TesselTypes.Pin];
};

export function setTallyState(lightIndex: number, state: TALLY_STATE) {
	if (lightIndex < 0) {
		throw new Error(`lightIndex must be greater than or equal to 0 ("${lightIndex}" was provided`);
	}

	if (lightIndex > 7) {
		throw new Error(`lightIndex must be less than or equal to 8 ("${lightIndex}" was provided`);
	}

	switch (state) {
		case TALLY_STATE.NONE:
			// Turn off PGM and PVW.
			return Promise.all([
				togglePin(TALLY_MAPPING[lightIndex][0], false),
				togglePin(TALLY_MAPPING[lightIndex][1], false)
			]);
		case TALLY_STATE.PROGRAM:
			// Turn on PGM, turn off PVW.
			return Promise.all([
				togglePin(TALLY_MAPPING[lightIndex][0], true),
				togglePin(TALLY_MAPPING[lightIndex][1], false)
			]);
		case TALLY_STATE.PREVIEW:
			// Turn off PGM, turn on PVW.
			return Promise.all([
				togglePin(TALLY_MAPPING[lightIndex][0], false),
				togglePin(TALLY_MAPPING[lightIndex][1], true)
			]);
		default:
			return Promise.reject(new Error(`Invalid tally state provided (${state})`));
	}
}

export async function statusReport() {
	const promises = [];

	for (const lightIndex in TALLY_MAPPING) { // tslint:disable-line:no-for-in
		const pins = TALLY_MAPPING[lightIndex];
		promises.push(
			Promise.all([
				readPin(pins[0]),
				readPin(pins[1])
			])
		);
	}

	const results = await Promise.all(promises);
	console.log('Status report:');
	results.forEach((result, index) => {
		console.log(`\t#${index} | PGM: ${result[0]}, PVW: ${result[1]}`);
	});
}

function togglePin(pin: TesselTypes.Pin, on: boolean) {
	return new Promise((resolve, reject) => {
		pin.write(on ? 1 : 0, error => {
			if (error) {
				log.error('Error toggling pin:', error);
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

function readPin(pin: TesselTypes.Pin) {
	return new Promise((resolve, reject) => {
		pin.read((error, value) => {
			if (error) {
				reject(error);
			} else {
				resolve(value);
			}
		});
	});
}

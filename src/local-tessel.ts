'use strict';

// Native
import tessel = require('tessel'); // tslint:disable-line:no-implicit-dependencies

// Packages
import debounce = require('lodash.debounce');

// Ours
import {createLogger} from './logger';
import {Tessel as TesselTypes} from './types/tessel-types';

const DEBOUNCE_MS = 100;
const log = createLogger('Tessel');
const readDebouncers = new Map();
const writeDebouncers = new Map();

// Create debouncers.
for (const portName in tessel.port) { // tslint:disable-line:no-for-in
	const port = (tessel.port as any)[portName] as TesselTypes.Port;
	for (const pin of port.pin) {
		readDebouncers.set(pin, debounce(_readPin, DEBOUNCE_MS));
		writeDebouncers.set(pin, debounce(_writePin, DEBOUNCE_MS));
	}
}

export function readPin(pin: TesselTypes.Pin) {
	return readDebouncers.get(pin)(pin);
}

export function writePin(pin: TesselTypes.Pin, value: 0 | 1) {
	return writeDebouncers.get(pin)(pin, value);
}

function _readPin(pin: TesselTypes.Pin) {
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

function _writePin(pin: TesselTypes.Pin, value: 0 | 1) {
	log.debug(`Setting port ${pin.port.name} pin ${pin.pin} to "${value}"...`);
	return new Promise((resolve, reject) => {
		const callback = (error: Error, buffer: Buffer) => {
			if (error) {
				reject(error);
				log.error(`Failed to set port ${pin.port.name} pin ${pin.pin} to "${value}": %s`, error ? error : 'Unknown error.');
			} else {
				resolve(buffer);
				log.debug(`Successfully set port ${pin.port.name} pin ${pin.pin} to "${value}"!`);
			}
		};

		if (value === 1) {
			pin.pull('pullup', callback);
		} else {
			pin.write(value, callback);
		}
	});
}

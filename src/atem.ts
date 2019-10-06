'use strict';

// Packages
import {Atem} from 'atem-connection';
import * as deepEqual from 'fast-deep-equal';

// Ours
import {createLogger} from './logger';
import * as Tally from './tally';

export class ATEMTally {
	ip: string;
	log = createLogger('ATEM');
	data: {
		previewInputs: number[];
		programInputs: number[];
	};
	_atem: Atem;
	_inputToTallyLightMap: {[k: number]: number};

	constructor({
		inputToTallyLightMap
	}: {
		inputToTallyLightMap: {[k: number]: number};
	}) {
		this._atem = new Atem({
			debug: true,
			externalLog: this.log.debug
		});

		this.data = {
			previewInputs: [0],
			programInputs: [0]
		};

		this._inputToTallyLightMap = inputToTallyLightMap;

		this._atem.on('connected', () => {
			this.log.info('Connected.');
		});

		this._atem.on('disconnected', () => {
			this.log.info('Disconnected.');
		});

		this._atem.on('error', error => {
			this.log.error('', error);
		});

		this._atem.on('stateChanged', () => {
			let changeDetected = false;

			const freshPgmInputs = this._atem.listVisibleInputs('program');
			if (!deepEqual(freshPgmInputs, this.data.programInputs)) {
				this.data.programInputs = freshPgmInputs;
				changeDetected = true;
			}

			const freshPvwInputs = this._atem.listVisibleInputs('preview');
			if (!deepEqual(freshPvwInputs, this.data.previewInputs)) {
				this.data.previewInputs = freshPvwInputs;
				changeDetected = true;
			}

			if (changeDetected) {
				this._updateTallyLights();
			}
		});
	}

	connect({ip}: {ip: string}) {
		this.ip = ip;
		return this._atem.connect(ip);
	}

	_updateTallyLights() {
		this.log.info('Updating tally lights...');

		// If input is PGM, light red.
		// Else, if input is PVW, light green.
		// Else, darken.
		Object.entries(this._inputToTallyLightMap).forEach(([key, tallyNumber]) => {
			const inputNumber = parseInt(key, 10);
			if (this.data.programInputs.includes(inputNumber)) {
				Tally.setTallyState(tallyNumber, Tally.TALLY_STATE.PREVIEW); // Yes, I know these are flipped.
			} else if (this.data.previewInputs.includes(inputNumber)) {
				Tally.setTallyState(tallyNumber, Tally.TALLY_STATE.PROGRAM); // Yes, I know these are flipped.
			} else {
				Tally.setTallyState(tallyNumber, Tally.TALLY_STATE.NONE);
			}
		});
	}
}

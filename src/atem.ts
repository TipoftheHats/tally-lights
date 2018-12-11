'use strict';

// Packages
import {Atem} from 'atem-connection';

// Ours
import {createLogger} from './logger';
import * as Tally from './tally';

export class ATEMTally {
	ip: string;
	log = createLogger('ATEM');
	data: {
		previewInput: number;
		programInput: number;
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
			previewInput: 0,
			programInput: 0
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

		this._atem.on('stateChanged', state => {
			const me = state.video.getMe(0);
			if (!me) {
				return;
			}

			let changeDetected = false;
			if (me.programInput !== this.data.programInput) {
				this.data.programInput = me.programInput;
				changeDetected = true;
			}

			if (me.previewInput !== this.data.previewInput) {
				this.data.previewInput = me.previewInput;
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
			if (inputNumber === this.data.programInput) {
				Tally.setTallyState(tallyNumber, Tally.TALLY_STATE.PROGRAM);
			} else if (inputNumber === this.data.previewInput) {
				Tally.setTallyState(tallyNumber, Tally.TALLY_STATE.PREVIEW);
			} else {
				Tally.setTallyState(tallyNumber, Tally.TALLY_STATE.NONE);
			}
		});
	}
}

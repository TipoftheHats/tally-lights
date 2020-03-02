// Native
import { EventEmitter } from 'events';

// Packages
import { Atem } from 'atem-connection';
import * as deepEqual from 'fast-deep-equal';

// Ours
import { createLogger } from '../common/logger';
import { TallyState } from '../types/socket-protocol';

export class ATEMTally extends EventEmitter {
	ip: string;
	log = createLogger('ATEM');
	data: {
		previewInputs: number[];
		programInputs: number[];
	};

	private readonly _atem: Atem;
	private readonly _inputToTallyLightMap: { [k: number]: number };

	constructor({ inputToTallyLightMap }: { inputToTallyLightMap: { [k: number]: number } }) {
		super();

		this._atem = new Atem();

		this.data = {
			previewInputs: [0],
			programInputs: [0],
		};

		this._inputToTallyLightMap = inputToTallyLightMap;

		this._atem.on('info', info => {
			this.log.info(info);
		});

		this._atem.on('connected', () => {
			this.log.info('Connected.');
		});

		this._atem.on('disconnected', () => {
			this.log.info('Disconnected.');
		});

		this._atem.on('error', error => {
			this.log.error(error);
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

	async connect({ ip }: { ip: string }): Promise<void> {
		this.ip = ip;
		return this._atem.connect(ip);
	}

	private _updateTallyLights(): void {
		this.log.info('Updating tally lights...');
		const newState: TallyState[] = [];
		Object.entries(this._inputToTallyLightMap).forEach(([key, tallyNumber]) => {
			const inputNumber = parseInt(key, 10);
			const s: TallyState = { channel: tallyNumber, state: 'none' };
			if (this.data.programInputs.includes(inputNumber)) {
				s.state = 'program';
			} else if (this.data.previewInputs.includes(inputNumber)) {
				s.state = 'preview';
			}

			newState.push(s);
		});

		this.emit('update', newState);
	}
}

'use strict';

// Packages
import * as OBSWebSocket from 'obs-websocket-js';

// Ours
import {createLogger} from './logger';
import * as Tally from './tally';

export class OBSTally {
	ip: string;
	port = 4444;
	password = '';
	log = createLogger('OBS');
	data: {
		previewScene: OBSWebSocket.Scene | null;
		programScene: OBSWebSocket.Scene | null;
	};
	_connectionStatus: 'connecting' | 'error' | 'disconnected' | 'connected';
	_reconnectInterval: NodeJS.Timer | undefined;
	_obsWebsocket = new OBSWebSocket();
	_ignoreConnectionClosedEvents = false;
	_sceneItemToTallyLightMap: {[k: string]: number};

	constructor({
		sceneItemToTallyLightMap
	}: {
		sceneItemToTallyLightMap: {[k: string]: number};
	}) {
		this.data = {
			previewScene: null,
			programScene: null
		};

		this._sceneItemToTallyLightMap = sceneItemToTallyLightMap;

		this._obsWebsocket.on('ConnectionClosed', () => {
			this._reconnectToOBS();
		});

		this._obsWebsocket.on('SwitchScenes', () => {
			this._updatePreviewScene();
			this._updateProgramScene();
		});

		this._obsWebsocket.on('PreviewSceneChanged', (data: any) => {
			this.data.previewScene = {
				name: data.sceneName,
				sources: data.sources
			};
			this._updateTallyLights();
		});

		setInterval(() => {
			if (this._connectionStatus === 'connected' && !(this._obsWebsocket as any)._connected) {
				this.log.warn('Thought we were connected, but the automatic poll detected we were not. Correcting.');
				if (this._reconnectInterval) {
					clearInterval(this._reconnectInterval);
				}
				this._reconnectInterval = undefined;
				this._reconnectToOBS();
			}
		}, 1000);
	}

	connect({ip, port = 4444, password = ''}: {ip: string; port: number; password: string}) {
		this.ip = ip;
		this.port = port;
		this.password = password;

		return this._connectToOBS().catch((err: any) => {
			this._connectionStatus = 'error';
			this.log.error('Failed to connect:', err);

			/* istanbul ignore else: this is just an overly-safe way of logging these critical errors */
			if (err.error && typeof err.error === 'string') {
				this.log.error(err.error);
			} else if (err.message) {
				this.log.error(err.message);
			} else if (err.code) {
				this.log.error(err.code);
			} else {
				this.log.error(err);
			}
		});
	}

	/**
	 * Attemps to connect to OBS Studio via obs-websocket using the parameters
	 * defined on the instance.
	 */
	_connectToOBS() {
		if (this._connectionStatus === 'connected') {
			throw new Error('Attempted to connect to OBS while already connected!');
		}

		this._connectionStatus = 'connecting';

		return this._obsWebsocket.connect({
			address: `${this.ip}:${this.port}`,
			password: this.password
		}).then(() => {
			this.log.info('Connected.');
			if (this._reconnectInterval) {
				clearInterval(this._reconnectInterval);
			}
			this._reconnectInterval = undefined;
			this._connectionStatus = 'connected';
			return this._fullUpdate();
		});
	}

	/**
	 * Attempt to reconnect to OBS, and keep re-trying every 5s until successful.
	 */
	_reconnectToOBS() {
		if (this._reconnectInterval) {
			return;
		}

		if (this._ignoreConnectionClosedEvents) {
			this._connectionStatus = 'disconnected';
			return;
		}

		this._connectionStatus = 'connecting';
		this.log.warn('Connection closed, will attempt to reconnect every 5 seconds.');
		this._reconnectInterval = setInterval(() => {
			// Intentionally discard error messages -- bit dangerous.
			this._connectToOBS().catch(() => {}); // tslint:disable-line:no-empty
		}, 5000);
	}

	/**
	 * Gets the current scene info from OBS, and detemines what layout is active based
	 * on the sources present in that scene.
	 */
	_fullUpdate() {
		return Promise.all([
			this._updateProgramScene(),
			this._updatePreviewScene()
		]);
	}

	/**
	 * Updates the programScene data with the current value from OBS.
	 */
	_updateProgramScene() {
		return this._obsWebsocket.send('GetCurrentScene').then((res: any) => {
			this.data.programScene = {
				name: res.name,
				sources: res.sources
			};
			this._updateTallyLights();
			return res;
		}).catch((err: any) => {
			this.log.error('Error updating program scene: %s', err ? err : 'unknown error');
		});
	}

	/**
	 * Updates the previewScene data with the current value from OBS.
	 */
	_updatePreviewScene() {
		return this._obsWebsocket.send('GetPreviewScene').then((res: any) => {
			this.data.previewScene = {
				name: res.name,
				sources: res.sources
			};
			this._updateTallyLights();
		}).catch((err: any) => {
			if (err.error === 'studio mode not enabled') {
				this.data.previewScene = null;
				return;
			}

			this.log.error('Error updating preview scene: %s', err ? err : 'unknown error');
		});
	}

	_updateTallyLights() {
		this.log.info('Updating tally lights...');

		// If scene item exists in PGM, light red.
		// Else, if scene item exists in PVW, light green.
		// Else, darken.
		Object.entries(this._sceneItemToTallyLightMap).forEach(([key, value]) => {
			if (this.data.programScene && findSceneItemByName(this.data.programScene, key)) {
				Tally.setTallyState(value, Tally.TALLY_STATE.PROGRAM);
			} else if (this.data.previewScene && findSceneItemByName(this.data.previewScene, key)) {
				Tally.setTallyState(value, Tally.TALLY_STATE.PREVIEW);
			} else {
				Tally.setTallyState(value, Tally.TALLY_STATE.NONE);
			}
		});
	}
}

function findSceneItemByName(scene: OBSWebSocket.Scene, name: string) {
	return scene.sources.find(source => {
		return source.name === name;
	});
}

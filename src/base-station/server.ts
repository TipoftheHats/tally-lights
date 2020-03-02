// Packages
import * as io from 'socket.io';
import * as clone from 'clone';

// Ours
import { TypedServer, TallyState } from '../types/socket-protocol';
import config from '../common/config';

const server = io(config.get('baseStation').port) as TypedServer;
const lightServer = server.of('/light');
let lastTallyState: TallyState[];

lightServer.on('connection', client => {
	client.emit('setBrightness', {
		preview: config.get('light').previewBrightness,
		program: config.get('light').programBrightness,
	});

	if (lastTallyState) {
		client.emit('setTally', lastTallyState);
	}
});

export function setTally(newTallyState: TallyState[]): void {
	lastTallyState = clone(newTallyState);
	lightServer.emit('setTally', lastTallyState);
}

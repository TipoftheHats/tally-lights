// Packages
import * as io from 'socket.io';

// Ours
import { TypedServer } from '../types/socket-protocol';
import config from '../common/config';

const server = io(config.get('baseStation').port) as TypedServer;
export const lightServer = server.of('/light');
lightServer.on('connection', client => {
	client.emit('setBrightness', {
		preview: config.get('light').previewBrightness,
		program: config.get('light').programBrightness,
	});
});

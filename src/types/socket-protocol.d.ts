// Packages
import { ServerDefinition, SimpleNamespace, RootServer, ClientSideSocket } from 'typed-socket.io';

export type TallyState = {
	channel: number;
	state: 'preview' | 'program' | 'none';
};

export interface TallyServerDefinition extends ServerDefinition {
	namespaces: {
		'/light': SimpleNamespace<{
			// Messages the server may send to the clients
			ServerMessages: {
				setBrightness: {
					program: number;
					preview: number;
				};
				setTally: TallyState[];
			};
			// Messages clients can send to the server, with a typed response
			ClientRPCs: {
				// (not needed here)
			};
			// Messages clients can send to the server (without a response)
			ClientMessages: {
				// (not needed here)
			};
		}>;
		// ...
	};
}

export type TypedServer = RootServer<TallyServerDefinition>;
export type TypedLightClient = ClientSideSocket<TallyServerDefinition, '/light'>;

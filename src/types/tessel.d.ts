// Type definitions for tessel 0.2
// Project: https://github.com/tessel/project#readme
// Definitions by: Alex Van Camp <https://github.com/Lange>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4

declare module 'tessel' {
	namespace Tessel { // tslint:disable-line:no-namespace
		interface Interface { // tslint:disable-line:no-unused
			port: {
				A: Port;
				B: Port;
			};
		}

		interface Port {
			name: string;
			pin: Pin[];
			pending: number;
			mode: string;
		}

		interface Pin {
			write(value: number, callback: (error: Error, buffer: Buffer) => void): void;
			read(callback: (error: Error, value: number) => void): void;
			pull(pullType: 'pullup' | 'pulldown' | 'none', callback: (error: Error, buffer: Buffer) => void): void;
			pin: number;
			port: Port;
		}
	}

	const Tessel: Tessel.Interface; // tslint:disable-line:variable-name
	export = Tessel;
}

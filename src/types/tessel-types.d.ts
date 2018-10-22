export namespace Tessel { // tslint:disable-line:no-namespace
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

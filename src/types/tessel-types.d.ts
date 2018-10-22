export namespace Tessel { // tslint:disable-line:no-namespace
	interface Interface { // tslint:disable-line:no-unused
		port: {
			A: Port;
			B: Port;
		};
	}

	interface Port {
		pin: Pin[];
	}

	interface Pin {
		write(value: number, callback: (error: Error) => void): void;
		read(callback: (error: Error, value: number) => void): void;
	}
}

// Native
import * as path from 'path';

// Packages
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as appRootPath from 'app-root-path';
import * as mkdirp from 'mkdirp';

const logDir = path.join(appRootPath.toString(), 'logs');
const logPath = path.join(logDir, 'logs/tally-lights.log');
mkdirp.sync(logDir);

const defaultFormats = [
	winston.format.timestamp(),
	winston.format.splat(),
	winston.format.prettyPrint(),
	winston.format.printf(info => {
		return `${String(info.timestamp)} ${info.level}: ${info.message}`;
	}),
];

const transports: Transport[] = [
	new winston.transports.Console({
		format: winston.format.combine(winston.format.colorize(), ...defaultFormats),
		level: 'info',
	}),
	new winston.transports.File({
		format: winston.format.combine(...defaultFormats),
		level: 'debug',
		filename: logPath,
		maxsize: 1000000, // 1MB
		maxFiles: 5,
		tailable: true,
	}),
];

transports.forEach(transport => {
	transport.setMaxListeners(100);
});

export function createLogger(label: string): winston.Logger {
	const logger = winston.createLogger({ transports });
	logger.setMaxListeners(100);
	return new Proxy(logger, {
		get(target, propName) {
			const prop = target[propName as keyof winston.Logger];
			if (typeof prop === 'function') {
				return (...args: any[]) => {
					args[0] = `[${label}] ${String(args[0])}`;
					return (prop as any)(...args);
				};
			}

			return prop;
		},
	});
}

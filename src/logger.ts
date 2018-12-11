'use strict';

// Packages
import * as winston from 'winston';

export function createLogger(label: string) {
	const format = winston.format.combine(
		winston.format.colorize(),
		winston.format.label({label}),
		winston.format.timestamp(),
		winston.format.splat(),
		winston.format.prettyPrint(),
		winston.format.printf(info => {
			return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
		})
	);

	return winston.createLogger({
		transports: [
			new (winston.transports.Console)({
				format,
				level: 'debug'
			}),
			new winston.transports.File({
				format,
				level: 'debug',
				filename: '/root/tally-lights.log'
			})
		]
	});
}

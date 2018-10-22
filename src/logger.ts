'use strict';

// Packages
import * as winston from 'winston';

export function createLogger(label: string) {
	return winston.createLogger({
		transports: [
			new (winston.transports.Console)({
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.label({label}),
					winston.format.timestamp(),
					winston.format.splat(),
					winston.format.prettyPrint(),
					winston.format.printf(info => {
						return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
					})
				),
				level: 'debug'
			})
		]
	});
}

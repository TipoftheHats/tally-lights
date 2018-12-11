'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import * as winston from 'winston';
import * as Transport from 'winston-transport';

const logDrive = '/mnt/sda1';
const logPath = path.join(logDrive, 'tally-lights.log');

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

	const transports = [
		new (winston.transports.Console)({
			format,
			level: 'debug'
		})
	] as Transport[];

	if (fs.existsSync(logDrive)) {
		transports.push(new winston.transports.File({
			format,
			level: 'debug',
			filename: logPath
		}));
	}

	return winston.createLogger({transports});
}

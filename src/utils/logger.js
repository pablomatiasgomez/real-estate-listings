'use strict';

const TerminalFont = include('utils/terminal-font');

function Logger(className) {
	if (!className) throw 'Logger must have className!';

	this.timeZoneOffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
	this.className = className;

	Logger.prototype.maxClazzLength = Math.max(this.className.length, Logger.prototype.maxClazzLength);
}

Logger.newLogger = function(className) {
	return new Logger(className);
};

Logger.prototype.maxClazzLength = 0;

Logger.prototype.info = function() {
	let args = Array.prototype.slice.call(arguments);
	args = this.getPrefixAsArray('[INF]').concat(args);
	console.log.apply(this, args);
};

Logger.prototype.error = function() {
	let args = Array.prototype.slice.call(arguments);
	args = this.getPrefixAsArray('[ERR]').concat(args);
	args[0] = TerminalFont.FgRed + args[0];
	args[args.length - 1] += TerminalFont.Reset;
	console.error.apply(this, args);
};

Logger.prototype.getPrefixAsArray = function(type) {
	let localISOTime = (new Date(Date.now() - this.timeZoneOffset)).toISOString().slice(0,-1);
	let clazz = this.getClazzWithSpaces();
	return [localISOTime, clazz, type].filter(i => !!i);
};

Logger.prototype.getClazzWithSpaces = function() {
	return `                           [${this.className}]`.slice(-Logger.prototype.maxClazzLength - 2);
};

module.exports = Logger;

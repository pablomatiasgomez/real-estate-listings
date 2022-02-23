'use strict';

const TerminalFont = require('../utils/terminal-font.js');

class Logger {
    static newLogger(className) {
        return new Logger(className);
    }

    constructor(className) {
        if (!className) throw new Error("Logger must have className!");

        this.timeZoneOffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
        this.className = className;

        Logger.maxClazzNameLength = Math.max(this.className.length, Logger.maxClazzNameLength);
    }

    info() {
        console.log.apply(this, this.getArgsAsArray('INFO', [...arguments]));
    }

    warn() {
        console.warn.apply(this, this.getArgsAsArray('WARN', [...arguments], TerminalFont.FgYellow));
    }

    error() {
        console.error.apply(this, this.getArgsAsArray('ERROR', [...arguments], TerminalFont.FgRed));
    }

    getArgsAsArray(type, args, color) {
        let localISOTime = (new Date(Date.now() - this.timeZoneOffset)).toISOString().slice(0, -1);
        let clazz = `[${this.className}]`.padStart(Logger.maxClazzNameLength + 2);
        type = `[${type}]`.padEnd(7);
        if (color) {
            // Cannot use different arg item for the color because they are printed with spaces in the middle.
            // Only concat on the first as we know is the localISOTime, and use another item for the reset so that we don't break args.
            return [color + localISOTime, clazz, type, ...args, TerminalFont.Reset];
        } else {
            return [localISOTime, clazz, type, ...args];
        }
    }

}

Logger.maxClazzNameLength = 0;

module.exports = Logger;

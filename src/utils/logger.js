'use strict';

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
        console.warn.apply(this, this.getArgsAsArray('WARN', [...arguments]));
    }

    error() {
        console.error.apply(this, this.getArgsAsArray('ERROR', [...arguments]));
    }

    getArgsAsArray(type, args) {
        let localISOTime = (new Date(Date.now() - this.timeZoneOffset)).toISOString().slice(0, -1);
        let clazz = `[${this.className}]`.padStart(Logger.maxClazzNameLength + 2);
        type = `[${type}]`.padEnd(7);
        return [localISOTime, clazz, type, ...args];
    }

}

Logger.maxClazzNameLength = 0;

module.exports = Logger;

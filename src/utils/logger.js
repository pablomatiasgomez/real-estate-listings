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
        let args = Array.prototype.slice.call(arguments);
        args = this.getPrefixAsArray('[INF]').concat(args);
        console.log.apply(this, args);
    }

    error() {
        let args = Array.prototype.slice.call(arguments);
        args = this.getPrefixAsArray('[ERR]').concat(args);
        args = [TerminalFont.FgRed, ...args, TerminalFont.Reset];
        console.error.apply(this, args);
    }

    getPrefixAsArray(type) {
        let localISOTime = (new Date(Date.now() - this.timeZoneOffset)).toISOString().slice(0, -1);
        let clazz = this.getClazzWithSpaces();
        return [localISOTime, clazz, type].filter(i => !!i);
    }

    getClazzWithSpaces() {
        return `                                                     [${this.className}]`.slice(-Logger.maxClazzNameLength - 2);
    }

}

Logger.maxClazzNameLength = 0;

module.exports = Logger;

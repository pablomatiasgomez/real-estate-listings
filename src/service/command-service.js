'use strict';

const spawn = require('child_process').spawn;

const Utils = require('../utils/utils.js');

const logger = newLogger('CommandService');

//----------------------

class CommandService {
    constructor(command) {
        let parsed = command.split(" ");
        this.command = parsed[0];
        this.args = parsed.slice(1);
    }

    run() {
        logger.info(`Running ${this.command} ${this.args.join(" ")}`);
        this.proc = spawn(this.command, this.args);

        // Listen to stdout and stderr
        this.proc.stdout.on('data', (data) => logger.info(`[stdout][${this.command}]: ${data.toString()}`));
        this.proc.stderr.on('data', (data) => logger.error(`[stderr][${this.command}]: ${data.toString()}`));

        // Listen to exit
        this.proc.on('close', (code) => logger.info(`Command ${this.command} exited with code ${code}`));

        // Handle errors
        this.proc.on('error', (err) => logger.error(`Command ${this.command} failed to start process: ${err.message}`));

        // This is not ideal, but we eed to wait to process to start...
        return Promise.resolve().then(Utils.delay(3000));
    }

    close() {
        logger.info(`Shutting down command...`);
        this.proc.kill();
    }
}

module.exports = CommandService;

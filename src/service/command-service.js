'use strict';

const spawn = require('child_process').spawn;

const logger = newLogger('CommandService');

//----------------------

const STARTUP_WAIT_MS = 6000;

class CommandService {
    constructor(command) {
        let parsed = command.split(" ");
        this.command = parsed[0];
        this.args = parsed.slice(1);
    }

    run() {
        logger.info(`Running ${this.command} ${this.args.join(" ")}`);
        this.proc = spawn(this.command, this.args);

        this.proc.stdout.on('data', (data) => logger.info(`[stdout][${this.command}]: ${data.toString()}`));
        this.proc.stderr.on('data', (data) => logger.error(`[stderr][${this.command}]: ${data.toString()}`));
        this.proc.on('error', (err) => logger.error(`Command ${this.command} failed to start process: ${err.message}`));

        return new Promise((resolve, reject) => {
            let startupComplete = false;
            this.proc.on('close', (code) => {
                logger.info(`Command ${this.command} exited with code ${code}`);
                if (!startupComplete) {
                    reject(new Error(`Command ${this.command} exited with code ${code} before completing startup`));
                }
            });
            // Give the process a window to fail (e.g. ssh ConnectTimeout). If it stays alive, assume it's up.
            setTimeout(() => {
                startupComplete = true;
                resolve();
            }, STARTUP_WAIT_MS);
        });
    }

    close() {
        logger.info(`Shutting down command...`);
        this.proc.kill();
    }
}

module.exports = CommandService;

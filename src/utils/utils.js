'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

//----------------------

const CURRENT_BUILD = {
    changeset: childProcess.execSync(`git -C ${__project_dir} rev-parse HEAD`).toString().trim(),
    branch: childProcess.execSync(`git -C ${__project_dir} rev-parse --abbrev-ref HEAD`).toString().trim()
};

class Utils {
    constructor() {
        throw new Error("Utils class not meant to be instantiated");
    }

    static get CURRENT_BUILD() {
        return CURRENT_BUILD;
    }

    static delay(delayMs) {
        return result => new Promise(resolve => setTimeout(() => resolve(result), delayMs));
    }

    /**
     * @returns {string} the created dir
     */
    static createDirIfNotExists(dir) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
        return dir;
    }

    /**
     * @returns {Promise<>}
     */
    static createFile(filePath, contents) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, contents, err => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * @returns {Promise<string>}
     */
    static readFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf8", (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    }

    /**
     * Sorts all files by name in the given dir and returns the contents of the last one.
     * @param dir the dir in which to look up the files
     * @returns {Promise<string>}
     */
    static readLastFileSortedByName(dir) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) return reject(err);
                if (!files.length) return resolve(null);

                files.sort();
                let fileName = files[files.length - 1];
                Utils.readFile(path.join(dir, fileName)).then(content => resolve(content));
            });
        });
    }
}


module.exports = Utils;
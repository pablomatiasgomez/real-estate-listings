'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

//----------------------

let Utils = {};

Utils.CURRENT_BUILD = {
    changeset: childProcess.execSync(`git -C ${__project_dir} rev-parse HEAD`).toString().trim(),
    branch: childProcess.execSync(`git -C ${__project_dir} rev-parse --abbrev-ref HEAD`).toString().trim()
};

Utils.wrapError = function (message, error) {
    let newError = new Error(message);
    // Remove this function (wrapError) call from the stack..
    let newStack = newError.stack.split("\n");
    newStack.splice(1, 1);
    newStack = newStack.join("\n");
    newError.stack = `${newStack}\nCaused by: ${error.stack}`;
    return newError;
};

Utils.createDirIfNotExists = function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    return dir;
};

Utils.createFile = function (filePath, contents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, contents, err => {
            if (err) return reject(err);
            resolve();
        });
    });
};

Utils.readFile = function (filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

Utils.readFileSync = function (filePath) {
    return fs.readFileSync(filePath, "utf8");
};

/**
 * Sorts all files by name in the given dir and returns the contents of the last one.
 * @param dir the dir in which to lookup the files
 * @returns {Promise<string>}
 */
Utils.readLastFileSortedByName = function (dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) return reject(err);
            if (!files.length) return resolve(null);

            files.sort();
            let fileName = files[files.length - 1];
            Utils.readFile(path.join(dir, fileName)).then(content => resolve(content));
        });
    });
};

module.exports = Utils;
'use strict';

const fs = require('fs');
const childProcess = require('child_process');

//----------------------

let Utils = {};

Utils.CURRENT_BUILD = {
    changeset: childProcess.execSync(`git -C ${__project_dir} rev-parse HEAD`).toString().trim(),
    branch: childProcess.execSync(`git -C ${__project_dir} rev-parse --abbrev-ref HEAD`).toString().trim()
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

module.exports = Utils;
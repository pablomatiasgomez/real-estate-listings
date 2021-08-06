'use strict';

const sanitize = require("sanitize-filename");

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('FileDataRepository');

//----------------------

/**
 * Stores the data to the filesystem, grouped by id, creating a new file for each new time a data is stored.
 * @constructor
 */
function FileDataRepository(browser, notifierService) {
    this.browser = browser;
    this.notifierService = notifierService;
}

FileDataRepository.prototype.getLastDataFile = function (id) {
    let self = this;
    id = sanitize(id);
    let fileDir = Utils.createDirIfNotExists(self.getFileDir(id));

    logger.info(`Getting last data file for id ${id}`);
    return Utils.readLastFileSortedByName(fileDir).then(content => {
        if (!content) return content;
        if (typeof content !== "string") throw new Error(`cannot handle content type ${typeof content}`);
        return JSON.parse(content);
    });
};

FileDataRepository.prototype.createNewDataFile = function (id, data) {
    let self = this;
    id = sanitize(id);
    let fileDir = Utils.createDirIfNotExists(self.getFileDir(id));

    let newFilePath = `${fileDir}/${new Date().toISOString().split(".")[0]}.json`;
    return Utils.createFile(newFilePath, JSON.stringify(data));
};

FileDataRepository.prototype.getFileDir = function (id) {
    id = sanitize(id);
    return `${__project_dir}/exports/${id}`;
};

module.exports = FileDataRepository;


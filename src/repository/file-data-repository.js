'use strict';

const path = require('path');
const sanitize = require("sanitize-filename");

const Utils = require('../utils/utils.js');

const logger = newLogger('FileDataRepository');

//----------------------

/**
 * Stores the data to the filesystem, grouped by id, creating a new file for each new time a data is stored.
 */
class FileDataRepository {

    /**
     * Gets the latest saved file for the given id and returns the object with the data that it contains.
     * Returns {@code null} if no file is present.
     * @param id
     * @returns {Promise<{}>}
     */
    getLastDataFile(id) {
        id = sanitize(id);
        let fileDir = Utils.createDirIfNotExists(this.getFileDir(id));

        logger.info(`Getting last data file for id ${id}`);
        return Utils.readLastFileSortedByName(fileDir).then(content => {
            if (!content) return content;
            if (typeof content !== "string") throw new Error(`cannot handle content type ${typeof content}`);
            return JSON.parse(content);
        });
    }

    createNewDataFile(id, data) {
        id = sanitize(id);
        let fileDir = Utils.createDirIfNotExists(this.getFileDir(id));

        let newFilePath = path.join(fileDir, new Date().toISOString().split(".")[0] + ".json");
        return Utils.createFile(newFilePath, JSON.stringify(data));
    }

    getFileDir(id) {
        id = sanitize(id);
        return path.join(__project_dir, "exports", id);
    }
}

module.exports = FileDataRepository;


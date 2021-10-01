'use strict';

const Utils = require('../utils/utils.js');

const logger = newLogger('FileReaderService');

//----------------------

class FileReaderService {
    constructor() {
    }

    readFileUrls(filePath) {
        logger.info(`Reading urls from file ${filePath}`);
        return Utils.readFile(filePath).then(content => {
            let urls = content.split("\n")
                .map(url => url.trim())
                .filter(url => !!url && !url.startsWith("//"));
            logger.info(`Read ${urls.length} urls from ${filePath}`);
            return urls;
        });
    }
}

module.exports = FileReaderService;

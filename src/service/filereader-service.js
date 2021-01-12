'use strict';

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('FileReaderService');

//----------------------

function FileReaderService() {
}

FileReaderService.prototype.readFileUrls = function (filePath) {
    logger.info(`Reading urls from file ${filePath}`);
    return Utils.readFile(filePath).then(content => {
        let urls = content.split("\n")
            .map(url => url.trim())
            .filter(url => !!url && !url.startsWith("//"));
        logger.info(`Read ${urls.length} urls from ${filePath}`);
        return urls;
    });
};

module.exports = FileReaderService;

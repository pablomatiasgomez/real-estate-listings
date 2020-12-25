'use strict';

const jsonDiff = require('json-diff');

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('ExportService');

//----------------------

function ExportService(browser, notifierService) {
    this.browser = browser;
    this.notifierService = notifierService;
}

ExportService.prototype.exportData = function (urls) {
    let self = this;
    logger.info(`Exporting all data...`);

    let promise = Promise.resolve();
    urls.forEach(url => {
        promise = promise.then(() => {
            return self.browser.fetchData(url);
        }).then(response => {
            // First we check for data changes and notify:
            return self.verifyDataDifference(response.url, response.id, response.data).then(() => {
                logger.info(`Going to save data exported for id ${response.id}`);
                return self.createDataFile(response.id, response.data);
            });
        }).catch(e => {
            logger.error(`Failed to export data for url: `, url, e);
            throw e;
        }).delay(5000);
    });
    return promise;
};

ExportService.prototype.verifyDataDifference = function (url, id, currentData) {
    let self = this;

    return self.getLastDataFile(id).then(previousData => {
        if (!previousData) {
            return false;
        }
        logger.info(`Checking data changes... for ${id}`);
        let diff = jsonDiff.diffString(previousData, currentData, {
            color: false
        });
        if (diff) {
            logger.info("Differences were found for ${id}", diff);
            let message = `A difference was found for: \n` +
                `ID: ${id}\n` +
                `URL: ${url}\n\n` +
                diff;
            return self.notifierService.notify(message);
        }
    });
};

ExportService.prototype.getLastDataFile = function (id) {
    let self = this;

    return Utils.readLastFileSortedByName(self.getFileDir(id)).then(content => {
        if (!content) return content;
        return JSON.parse(content);
    });
};

ExportService.prototype.createDataFile = function (id, data) {
    let self = this;
    Utils.createDirIfNotExists(self.getFileDir(id));
    return Utils.createFile(self.getFilePath(id), JSON.stringify(data));
};

ExportService.prototype.getFilePath = function (id) {
    let self = this;
    return `${self.getFileDir(id)}/${new Date().toISOString().split(".")[0]}.json`;
};

ExportService.prototype.getFileDir = function (id) {
    return `${__project_dir}/exports/${id}`;
};

module.exports = ExportService;


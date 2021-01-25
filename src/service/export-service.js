'use strict';

const jsonDiff = require('json-diff');
const sanitize = require("sanitize-filename");

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('ExportService');

//----------------------

function ExportService(browser, notifierService) {
    this.browser = browser;
    this.notifierService = notifierService;
}

ExportService.prototype.exportData = function (urls) {
    let self = this;
    logger.info(`Exporting ${urls.length} urls..`);

    let startTime = Date.now();
    let promise = Promise.resolve();
    urls.forEach((url, i) => {
        promise = promise.then(() => {
            let elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
            let remainingMinutes = i === 0 ? "n/a" : Math.round((urls.length - i) * elapsedMinutes / i) + "m";
            logger.info(`[${i + 1}/${urls.length}] [ETA:${remainingMinutes}] Processing url ${url} ..`);
            return self.browser.fetchData(url);
        }).then(response => {
            if (!response) return; // Skip not handled urls.
            response.id = sanitize(response.id);

            Utils.createDirIfNotExists(self.getFileDir(response.id));

            // First we check for data changes and notify:
            return self.verifyDataDifference(response.url, response.id, response.data).then(() => {
                logger.info(`Going to save data exported for id ${response.id}`);
                return self.createDataFile(response.id, response.data);
            });
        }).catch(e => {
            logger.error(`Failed to export data for url: ${url} `, e);
            // Log error to telegram and continue
            // self.notifierService.notify(`Failed to export data for url ${url}`);
        });
    });
    return promise;
};

ExportService.prototype.verifyDataDifference = function (url, id, currentData) {
    let self = this;

    return self.getLastDataFile(id).then(previousData => {
        logger.info(`Checking data changes... for ${id}`);
        if (!previousData) {
            logger.info(`There was no previous data for ${id} .. skipping difference check.`);
            return false;
        }
        previousData.EXPORT_VERSION = previousData.EXPORT_VERSION || "0";
        if (previousData.EXPORT_VERSION !== currentData.EXPORT_VERSION) {
            logger.info(`Not checking data difference because version is different. Previous Version: ${previousData.EXPORT_VERSION} !== ${currentData.EXPORT_VERSION} Current Version.`);
            return false;
        }
        let diff = jsonDiff.diffString(previousData, currentData, {
            color: false
        });
        if (diff) {
            logger.info(`Differences were found for ${id}\n`, diff);
            let message = `A difference was found for: \n` +
                `ID: ${id}\n` +
                `URL: ${url}\n\n` +
                diff;
            return self.notifierService.notify(message);
        }
        logger.info("No difference was found!");
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


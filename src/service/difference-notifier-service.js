'use strict';

const jsonDiff = require('json-diff');

const logger = include('utils/logger').newLogger('DifferenceNotifierService');

//----------------------

/**
 * Service that exports all the given urls and compares the data against the previous exported version.
 * If any difference is found, it notifies using the notifierService
 * @constructor
 */
function DifferenceNotifierService(fileDataRepository, browser, notifierService) {
    this.fileDataRepository = fileDataRepository;
    this.browser = browser;
    this.notifierService = notifierService;
}

DifferenceNotifierService.prototype.exportData = function (urls) {
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

            // First we check for data changes and notify:
            return self.verifyDataDifference(response.url, response.id, response.data).then(() => {
                logger.info(`Going to save data exported for id ${response.id}`);
                return self.fileDataRepository.createNewDataFile(response.id, response.data);
            });
        }).catch(e => {
            // Log error and continue
            logger.error(`Failed to export data for url: ${url} `, e);
        });
    });
    return promise;
};

DifferenceNotifierService.prototype.verifyDataDifference = function (url, id, currentData) {
    let self = this;

    return self.fileDataRepository.getLastDataFile(id).then(previousData => {
        logger.info(`Checking data changes... for ${id}`);
        if (!previousData) {
            logger.info(`There was no previous data for ${id} .. skipping difference check.`);
            return;
        }
        previousData.EXPORT_VERSION = previousData.EXPORT_VERSION || "0";
        if (previousData.EXPORT_VERSION !== currentData.EXPORT_VERSION) {
            logger.info(`Not checking data difference because version is different. Previous Version: ${previousData.EXPORT_VERSION} !== ${currentData.EXPORT_VERSION} Current Version.`);
            return;
        }
        let diff = jsonDiff.diffString(previousData, currentData, {color: false}, {showKeys: ["url"]});
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

module.exports = DifferenceNotifierService;


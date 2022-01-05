'use strict';

const jsonDiff = require('json-diff');

const logger = newLogger('DifferenceNotifierService');

//----------------------

/**
 * Service that exports all the given urls and compares the data against the previous exported version.
 * If any difference is found, it notifies using the notifierService
 */
class DifferenceNotifierService {

    constructor(fileDataRepository, browser, notifierService) {
        this.fileDataRepository = fileDataRepository;
        this.browser = browser;
        this.notifierService = notifierService;
    }

    exportData(urls) {
        let self = this;
        logger.info(`Exporting ${urls.length} urls..`);

        let startTime = Date.now();
        let totalSkipped = 0;
        let totalDiffs = 0;
        let totalErrors = 0;
        let promise = Promise.resolve();
        urls.forEach((url, i) => {
            promise = promise.then(() => {
                let elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
                let remainingMinutes = i === 0 ? "n/a" : Math.round((urls.length - i) * elapsedMinutes / i) + "m";
                logger.info(`[${i + 1}/${urls.length}] [ETA:${remainingMinutes}] Processing url ${url} ..`);
                return self.browser.fetchData(url);
            }).then(response => {
                if (!response) { // Skip not handled urls.
                    totalSkipped++;
                    return;
                }

                // Check for data changes and notify:
                return self.verifyDataDifference(response.url, response.id, response.data).then(hadDifference => {
                    if (hadDifference) totalDiffs++;
                    logger.info(`Going to save data exported for id ${response.id}`);
                    return self.fileDataRepository.createNewDataFile(response.id, response.data);
                });
            }).catch(e => {
                // Log error and continue
                totalErrors++;
                logger.error(`Failed to export data for url: ${url} `, e);
            });
        });
        return promise.then(() => {
            let elapsedMinutes = Math.round(((Date.now() - startTime) / 1000 / 60));
            let message = `Finished checking ${urls.length} urls (${totalSkipped} skipped) in ${elapsedMinutes} minutes, with ${totalDiffs} differences, and ${totalErrors} errors.`;
            logger.info(message);
            return self.notifierService.notify(message);
        });
    }

    verifyDataDifference(url, id, currentData) {
        let self = this;

        return self.fileDataRepository.getLastDataFile(id).then(previousData => {
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
            let diff = jsonDiff.diffString(previousData, currentData, {color: false, outputKeys: ["url"]});
            if (diff) {
                logger.info(`Differences were found for ${id}\n`, diff);
                let message = `A difference was found for: \n` +
                    `ID: ${id}\n` +
                    `URL: ${url}\n\n` +
                    diff;
                return self.notifierService.notify(message).then(() => true);
            }
            logger.info("No difference was found!");
            return false;
        });
    }
}

module.exports = DifferenceNotifierService;


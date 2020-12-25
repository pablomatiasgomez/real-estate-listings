'use strict';

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
            logger.info(`Going to save data exported for id ${response.id}`);
            return self.createDataFile(response.id, response.data);
        }).catch(e => {
            logger.error(`Failed to export data for url: `, url, e);
            throw e;
        }).delay(5000);
    });
    return promise;
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


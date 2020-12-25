'use strict';

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('ExportService');

//----------------------

function ExportService(browser) {
    this.browser = browser;
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
            return Utils.createFile(self.getFilePath(response.id), JSON.stringify(response.data));
        }).catch(e => {
            logger.error(`Failed to export data for url: `, url, e);
            throw e;
        });
    })
};

ExportService.prototype.getFilePath = function (id) {
    return `${__project_dir}/exports/${id}/${new Date().toISOString().split(".")[0]}.json`;
};

module.exports = ExportService;


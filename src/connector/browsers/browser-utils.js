'use strict';

const logger = include('utils/logger').newLogger('BrowserUtils');

//---------------

let BrowserUtils = {};

/**
 *
 * @param browserPage the puppeteer browser that has the first page loaded.
 * @param siteBrowser the handler for this given page, must have the following methods:
 * - {@link extractListPage} which extracts the listings in the current page, as map from id -> data, and also includes the pages.
 * - {@link getListPageUrl} which returns the new url for the given page number.
 * @returns Promise
 */
BrowserUtils.extractListingsPages = function (browserPage, siteBrowser) {
    logger.info(`Extracting listings pages data...`);

    let listUrl = browserPage.url();
    let response = {};

    return siteBrowser.extractListPage(browserPage).then(pageResponse => {
        logger.info(`Assigning ${Object.keys(pageResponse)} ...`);
        Object.assign(response, pageResponse);
        return pageResponse.pages;
    }).then(pages => {
        logger.info(`Pages are: ${pages}. We still need to process: ${pages.slice(1)}`);

        let promise = Promise.resolve();
        pages.slice(1).forEach(pageNumber => {
            promise = promise.delay(8000).then(() => {
                let pageUrl = siteBrowser.getListPageUrl(listUrl, pageNumber);
                logger.info(`Processing page ${pageNumber}. Url: ${pageUrl}`);
                return browserPage.goto(pageUrl, {
                    waitUntil: 'load',
                    timeout: 5 * 60 * 1000,
                    referer: listUrl,
                });
            }).delay(12000).then(() => {
                return BrowserUtils.addCommonFunctions(browserPage);
            }).then(() => {
                return siteBrowser.extractListPage(browserPage);
            }).delay(1000).then(pageResponse => {
                logger.info(`Assigning ${Object.keys(pageResponse)} ...`);
                Object.assign(response, pageResponse);
            });
        });
        return promise;
    }).then(() => {
        return response;
    });
};

BrowserUtils.addCommonFunctions = function (browserPage) {
    return browserPage.evaluate(() => {
        window.BrowserUtils = {};
        /**
         * Converts an int that represents the number of pages, to an array with all page numbers.
         * For example, 5 -> [1, 2, 3, 4, 5]
         * @param pageCount the number of pages
         * @returns {number[]}
         */
        window.BrowserUtils.pageCountToPagesArray = function (pageCount) {
            return Array.from(Array(pageCount + 1).keys()).slice(1);
        };
    });
};


module.exports = BrowserUtils;
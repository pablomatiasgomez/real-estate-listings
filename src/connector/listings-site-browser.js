// noinspection JSUnusedLocalSymbols

'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('ListingsSiteBrowser');

//---------------

/**
 * Specific implementation that iterates over all the pages of a listings site, in order to retrieve all items
 * @constructor
 */
function ListingsSiteBrowser(urlRegex) {
    SiteBrowser.call(this, urlRegex);
}

util.inherits(ListingsSiteBrowser, SiteBrowser);

/**
 * This method must be implemented and should extract the listings in the current page,
 * as map from id -> data, and also includes the pages.
 * @param browserPage the puppeteer browser with the current page already loaded.
 */
ListingsSiteBrowser.prototype.extractListPage = function (browserPage) {
    throw new Error("Method must be implemented!");
};

/**
 * This method msut be implemented and should return the new url for the given page number.
 * @param listUrl the original list url
 * @param pageNumber the page number to be used to build the new url
 */
ListingsSiteBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    throw new Error("Method must be implemented!");
};

/**
 *
 * @param browserPage the puppeteer browser that has the first page loaded.
 * @returns Promise
 */
ListingsSiteBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    logger.info(`Extracting listings pages data...`);

    let listUrl = browserPage.url();
    let response = {};

    return self.extractListPage(browserPage).then(pageResponse => {
        logger.info(`Assigning ${Object.keys(pageResponse)} ...`);
        Object.assign(response, pageResponse);
        return pageResponse.pages;
    }).then(pages => {
        logger.info(`Pages are: ${pages}. We still need to process: ${pages.slice(1)}`);

        let promise = Promise.resolve();
        pages.slice(1).forEach(pageNumber => {
            promise = promise.then(() => {
                let pageUrl = self.getListPageUrl(listUrl, pageNumber);
                logger.info(`Processing page ${pageNumber}. Url: ${pageUrl}`);
                return self.loadUrl(browserPage, pageUrl, listUrl);
            }).then(() => {
                return self.extractListPage(browserPage);
            }).delay(2000).then(pageResponse => {
                logger.info(`Assigning ${Object.keys(pageResponse)} ...`);
                Object.assign(response, pageResponse);
            });
        });
        return promise;
    }).then(() => {
        return response;
    });
};

// ---------

module.exports = ListingsSiteBrowser;

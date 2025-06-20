'use strict';

const SiteBrowser = require('./site-browser.js');

const Utils = require('../utils/utils.js');

const logger = newLogger('ListingsSiteBrowser');

//---------------

/**
 * Specific implementation that iterates over all the pages of a listings site, in order to retrieve all items
 */
class ListingsSiteBrowser extends SiteBrowser {

    constructor(urlRegex) {
        super(urlRegex);
    }

    /**
     * This method must be implemented and should extract the listings in the current page,
     * as map from id -> data, and also includes the pages.
     * @param browserPage the puppeteer browser page with the current page already loaded.
     */
    extractListPage(browserPage) {
        throw new Error("Method must be implemented!");
    }

    /**
     * This method must be implemented and should return the new url for the given page number.
     * @param listUrl the original list url
     * @param pageNumber the page number to be used to build the new url
     * @returns {string}
     */
    getListPageUrl(listUrl, pageNumber) {
        throw new Error("Method must be implemented!");
    }

    /**
     * @param browserPage the puppeteer browser that has the first page loaded.
     * @returns Promise
     */
    extractData(browserPage) {
        logger.info(`Extracting listings pages data...`);

        let listUrl = browserPage.url();
        let response = {};

        return this.extractListPage(browserPage).then(pageResponse => {
            logger.info(`Assigning ${Object.keys(pageResponse)} ...`);
            Object.assign(response, pageResponse);
            return pageResponse.pages;
        }).then(pages => {
            logger.info(`Pages are: ${pages}. We still need to process: ${pages.slice(1)}`);

            let promise = Promise.resolve();
            pages.slice(1).forEach(pageNumber => {
                promise = promise.then(() => {
                    let pageUrl = this.getListPageUrl(listUrl, pageNumber);
                    logger.info(`Processing page ${pageNumber}. Url: ${pageUrl}`);
                    return this.loadUrl(browserPage, pageUrl, listUrl);
                }).then(() => {
                    return this.extractListPage(browserPage);
                }).then(Utils.delay(2000)).then(pageResponse => {
                    logger.info(`Assigning ${Object.keys(pageResponse)} ...`);
                    Object.assign(response, pageResponse);
                });
            });
            return promise;
        }).then(() => {
            return response;
        });
    }
}

// ---------

module.exports = ListingsSiteBrowser;

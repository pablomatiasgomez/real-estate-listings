'use strict';

const Utils = require('../utils/utils.js');

const logger = newLogger('SiteBrowser');

//---------------

/**
 * Abstract SiteBrowser. Each site browser should implement this class.
 */
class SiteBrowser {

    /**
     * @param urlRegex regex to be used to extract the id and know if this browser can be used or not for a given url.
     * @constructor
     */
    constructor(urlRegex) {
        if (!urlRegex) throw new Error("No urlRegex provided!");
        this.urlRegex = urlRegex;
        if (!this.constructor.name.endsWith("Browser")) throw new Error(`Invalid browser name ${this.constructor.name}`);
        this.browserName = this.constructor.name.slice(0, -7);
    }

    name() {
        return this.browserName;
    }

    useStealthBrowser() {
        return false;
    }

    withJavascriptEnabled() {
        return true;
    }

    acceptsUrl(url) {
        return this.urlRegex.test(url);
    }

    getId(url) {
        let match = this.urlRegex.exec(url);
        if (!match || match.length !== 2) throw new Error(`Url couldn't be parsed: ${url}`);
        return match[1];
    }

    /**
     * This method must be implemented and should extract the listing data in the current page.
     * @param browserPage the puppeteer browser page with the current page already loaded.
     */
    extractData(browserPage) {
        throw new Error("Method must be implemented!");
    }

    extractUrlData(browserPage, url) {
        return this.loadUrl(browserPage, url).then(() => {
            return this.extractData(browserPage).catch(e => {
                // Save HTML to debug file for later analysis to understand what failed.
                return browserPage.evaluate(() => {
                    return document.documentElement.outerHTML;
                }).catch(htmlExtractError => {
                    // If fails to retrieve HTML, log it, but throw the original error.
                    logger.error(`Failed to extract HTML from page.`, htmlExtractError);
                    throw e;
                }).then(html => {
                    return Utils.saveHtmlToDebugFile(html);
                }).then(filePath => {
                    throw new Error(`Error while extracting page data. HTML for debug was saved at ${filePath}`, {cause: e});
                });
            });
        }).then(Utils.delay(2000));
    }

    loadUrl(browserPage, url, referer = "https://www.google.com/") {
        logger.info(`Loading url ${url}`);
        return Promise.resolve().then(() => {
            return browserPage.goto(url, {
                waitUntil: 'load',
                timeout: 5 * 60 * 1000,
                referer: referer,
            });
        }).then(Utils.delay(config.browser.timeBetweenPageFetchesMs)).then(() => {
            this.addCommonFunctions(browserPage);
        });
    }

    addCommonFunctions(browserPage) {
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
    }
}

// ---------

module.exports = SiteBrowser;

'use strict';

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('SiteBrowser');

//---------------

/**
 * Abstract SiteBrowser. Each site browser should implement this class.
 * @param urlRegex regex to be used to extract the id and kwno if this browser can be used or not for a given url.
 * @constructor
 */
function SiteBrowser(urlRegex) {
    if (!urlRegex) throw new Error("No urlRegex provided!");
    this.urlRegex = urlRegex;
    if (!this.constructor.name.endsWith("Browser")) throw new Error(`Invalid browser name ${this.constructor.name}`);
    this.browserName = this.constructor.name.slice(0, -7);
}

SiteBrowser.prototype.name = function () {
    return this.browserName;
};

SiteBrowser.prototype.useStealthBrowser = function () {
    return false;
};

SiteBrowser.prototype.withJavascriptEnabled = function () {
    return true;
};

SiteBrowser.prototype.acceptsUrl = function (url) {
    return this.urlRegex.test(url);
};

SiteBrowser.prototype.logHtmlOnError = function () {
    return false;
};

SiteBrowser.prototype.getId = function (url) {
    let match = this.urlRegex.exec(url);
    if (!match || match.length !== 2) throw new Error(`Url couldn't be parsed: ${url}`);
    return match[1];
};

SiteBrowser.prototype.extractData = function (browserPage) {
    throw new Error("Method must be implemented!");
};

SiteBrowser.prototype.extractUrlData = function (browserPage, url) {
    let self = this;
    return self.loadUrl(browserPage, url).then(() => {
        return self.extractData(browserPage).catch(e => {
            if (self.logHtmlOnError()) {
                return browserPage.evaluate(() => {
                    return document.getElementsByTagName("html")[0].innerHTML;
                }).catch(htmlExtractError => {
                    // If fails to retrieve HTML, return the original error.
                    logger.error(`Failed to extract HTML from page.`, htmlExtractError);
                    throw e;
                }).then(html => {
                    throw Utils.wrapError(`Error while extracting page data. HTML:\n------------------------------\n\n${html}\n\n------------------------------\n`, e);
                });
            }
            throw e;
        });
    }).delay(2000);
};

SiteBrowser.prototype.loadUrl = function (browserPage, url, referer = "https://www.google.com/") {
    let self = this;
    return Promise.resolve().then(() => {
        return browserPage.goto(url, {
            waitUntil: 'load',
            timeout: 5 * 60 * 1000,
            referer: referer,
        });
    }).delay(config.browser.timeBetweenPageFetchesMs).then(() => {
        self.addCommonFunctions(browserPage);
    });
};

SiteBrowser.prototype.addCommonFunctions = function (browserPage) {
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

// ---------

module.exports = SiteBrowser;

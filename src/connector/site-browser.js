'use strict';

const BotBlockedError = require('./bot-blocked-error.js');
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

    /**
     * Returns an array of cookies to be set before loading the page.
     * Each cookie should be an object with at least: name, value, domain, path
     * @returns {Array}
     */
    getCookies() {
        return [];
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
                // Save HTML to a debug file for later analysis to understand what failed.
                return this.captureDebugHtml(browserPage).then(filePath => {
                    let savedAt = filePath ? `HTML for debug was saved at ${filePath}` : `debug HTML could not be saved`;
                    throw new Error(`Error while extracting page data. ${savedAt}`, {cause: e});
                });
            });
        }).then(Utils.delay(2000));
    }

    /**
     * Captures the current page's full HTML and saves it to a debug file for later analysis.
     * Never throws: on failure it logs and resolves to null.
     * @param browserPage the puppeteer browser page
     * @param label optional label included in the debug file name to make it identifiable
     * @returns {Promise<string|null>} the path to the saved debug file, or null if it couldn't be saved
     */
    captureDebugHtml(browserPage, label) {
        return browserPage.evaluate(() => {
            return document.documentElement.outerHTML;
        }).then(html => {
            return Utils.saveHtmlToDebugFile(html, label);
        }).catch(e => {
            logger.error(`Failed to capture debug HTML from page.`, e);
            return null;
        });
    }

    loadUrl(browserPage, url, referer = "https://www.google.com/") {
        logger.info(`Loading url ${url}`);
        return Promise.resolve().then(() => {
            let cookies = this.getCookies();
            if (cookies.length > 0) {
                logger.info(`Setting ${cookies.length} cookie(s) before loading page...`);
                return browserPage.setCookie(...cookies);
            }
        }).then(() => {
            return browserPage.goto(url, {
                waitUntil: 'load',
                timeout: 5 * 60 * 1000,
                referer: referer,
            });
        }).then(response => {
            // A 5xx means the server (or an upstream gateway) transiently failed - e.g. a 502 that renders as
            // Chrome's error page. Parsing that as content produces false positives (e.g. a bogus OFFLINE), so
            // surface it as a retryable error instead.
            if (response && response.status() >= 500) {
                let error = new Error(`Server error: HTTP ${response.status()} while loading ${url}`);
                error.retryableHttpError = true;
                throw error;
            }
        }).then(Utils.delay(config.browser.timeBetweenPageFetchesMs)).then(() => {
            // Checked after the delay so that interstitials that auto-solve and reload (e.g. AWS WAF silent challenge) are not reported.
            return this.detectBotBlock(browserPage);
        }).then(blockReason => {
            if (blockReason) throw new BotBlockedError(blockReason, url);
            return this.addCommonFunctions(browserPage);
        });
    }

    /**
     * Detects whether the loaded page is an anti-bot interstitial (captcha / challenge / verification) instead of the real content.
     * Markers are checked on the page source (not on executed JS state) so that it also works with javascript disabled.
     * Covers generic anti-bot providers. Site browsers can override it to add site-specific checks.
     * @param browserPage the puppeteer browser page
     * @returns {Promise<string|null>} a short description of the block, or null if the page doesn't look blocked
     */
    detectBotBlock(browserPage) {
        return browserPage.evaluate(() => {
            let inlineScriptsInclude = str => [...document.scripts].some(script => script.textContent.includes(str));

            // AWS WAF interstitial (used by argenprop): defines window.gokuProps. Note that regular pages may load the
            // AWS WAF SDK (challenge.js) too, so that alone is not a block.
            if (inlineScriptsInclude("window.gokuProps")) {
                return document.querySelector("#captcha-container") ? "AWS WAF captcha" : "AWS WAF challenge";
            }
            // Cloudflare "Just a moment..." / managed challenge.
            if (inlineScriptsInclude("window._cf_chl_opt")) {
                return "Cloudflare challenge";
            }
            return null;
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

'use strict';

const puppeteer = require('puppeteer');

const ZonaPropBrowser = include('connector/zonaprop-browser');

const logger = include('utils/logger').newLogger('Browser');


//---------------

const DEBUG = true;

const SITE_BROWSERS = [
    new ZonaPropBrowser()
];

function Browser() {
    this.browser = null;
}

Browser.prototype.init = function () {
    let self = this;

    return Promise.resolve().then(() => {
        return puppeteer.launch({
            headless: !DEBUG,
            devtools: DEBUG,
        });
    }).then(browser => {
        self.browser = browser;
    });
};

Browser.prototype.fetchData = function (url) {
    let self = this;

    let siteBrowser = SITE_BROWSERS.filter(siteBrowser => siteBrowser.acceptsUrl(url))[0];
    if (!siteBrowser) {
        logger.error(`No site browser matches url ${url}`);
        throw `No site browser matches url ${url}`;
    }

    logger.info(`Getting url ${url} using ${siteBrowser.name()} ..`);
    return Promise.resolve().then(() => {
        return self.browser.newPage();
    }).then(page => {
        let data;
        return siteBrowser.fetchData(page, url).then(d => {
            data = d;
            return page.close();
        }).then(() => {
            return {
                id: siteBrowser.name() + "-" + siteBrowser.getId(url),
                data: data
            };
        });
    });

};

Browser.prototype.dispose = function () {
    logger.info(`Shutting down connector ..`);

    let self = this;
    return Promise.resolve().then(() => {
        if (self.browser) {
            return self.browser.close();
        }
    });
};

// ---------

module.exports = Browser;

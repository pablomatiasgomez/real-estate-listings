'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('SiGroupBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.sigroupinmobiliaria\.com\/(.+)$/;

function SiGroupBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(SiGroupBrowser, SiteBrowser);

SiGroupBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "1";

        let price = [...document.querySelectorAll("[data-testid='linkElement']")]
            .map(el => el.innerText)
            .filter(text => text.indexOf("$") !== -1)[0];

        // Consider the page broken as it may happen that it does not load sometimes..
        if (!price) throw "Couldn't find price!";

        // Many details as plain text..
        let textDetails = [...document.querySelectorAll("#SITE_PAGES [data-testid='richTextElement']")]
            .flatMap(i => i.innerText.split(/(?:\n|\. )+/))
            .map(l => l.trim())
            .filter(l => !!l);

        // TODO Pictures currently not working becasue JS is disabled. But it was flaky (because they are loaded via js..)
        // let pictureUrls = [...document.querySelectorAll("div[aria-label='Matrix gallery'] img")].map(img => img.src);

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            price: price,
            textDetails: textDetails,
        };
    });
};

// ---------

module.exports = SiGroupBrowser;

'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('SiGroupBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.sigroupinmobiliaria\.com\/(.+)$/;

class SiGroupBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "1";

            if (document.querySelector(".error-404-non-branded")) {
                // Not found, the listing was removed.
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "UNLISTED",
                };
            }

            let price = [...document.querySelector("main .txtNew").parentNode.childNodes]
                .map(el => el.innerText)
                .filter(text => text.indexOf("$") !== -1)[0];

            // Consider the page broken as it may happen that it does not load sometimes...
            if (!price) throw new Error("Couldn't find price!");

            // Many details as plain text...
            let textDetails = [...document.querySelectorAll("main .txtNew")]
                .flatMap(i => i.innerText.split(/(?:\n|\. )+/))
                .map(l => l.trim())
                .filter(l => !!l);

            // Pictures currently not working because JS is disabled, and it was flaky when JS was enabled, because they are loaded via ajax.
            // let pictureUrls = [...document.querySelectorAll("div[aria-label='Matrix gallery'] img")].map(img => img.src);

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                price: price,
                textDetails: textDetails,
            };
        });
    }
}


// ---------

module.exports = SiGroupBrowser;

'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('RemaxBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar.*\/listings\/((?!buy|rent)[\w\d-]+)(?:\?.*)?$/;

class RemaxBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    useStealthBrowser() {
        return true;
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            const EXPORT_VERSION = "4";

            if (window.location.pathname === "/") {
                // Removed listings get redirected to the homepage.
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "OFFLINE",
                };
            }

            let ngState = JSON.parse(document.querySelector("#ng-state").textContent);

            let remaxData = Object.values(ngState)
                .filter(v => v?.u?.includes("api/listings/findBySlug"))
                .map(v => v.b.data)
                [0];

            let response = Object.assign({EXPORT_VERSION: EXPORT_VERSION}, remaxData);

            // Geo object contains ids that change from time to time
            delete response.geo.id;
            delete response.geo.rootCount;

            return response;
        }).then(data => {
            // We have had some false positives for OFFLINE status, so dump the html to see what is going on.
            if (data && data.status === "OFFLINE") {
                return this.captureDebugHtml(browserPage).then(filePath => {
                    if (filePath) logger.warn(`Remax listing is OFFLINE. Saved debug HTML to ${filePath}`);
                    return data;
                });
            }
            return data;
        });
    }
}


// ---------

module.exports = RemaxBrowser;

'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('RemaxBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar.*\/listings\/((?!buy|rent)[\w\d-]+)(?:\?.*)?$/;

class RemaxBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            const EXPORT_VERSION = "4";

            let ngStateEl = document.querySelector("#ng-state");
            if (!ngStateEl) throw new Error("Remax: #ng-state not found - unexpected page.");

            let ngState = JSON.parse(ngStateEl.textContent);
            let findBySlug = Object.values(ngState).find(v => v?.u?.includes("api/listings/findBySlug"));
            if (!findBySlug) throw new Error("Remax: findBySlug entry not found in #ng-state - unexpected page.");

            let remaxData = findBySlug.b?.data;
            if (!remaxData) {
                // A removed listing returns data:null with an EntityNotFoundException ("No se encuentra propiedad").
                let errors = findBySlug.b?.errors || [];
                let message = findBySlug.b?.message || "";
                let isNotFound = errors.some(e => typeof e === "string" && e.includes("EntityNotFoundException")) || message.includes("No se encuentra propiedad");
                if (!isNotFound) throw new Error("Remax: findBySlug returned no data without a not-found error - unexpected response: " + JSON.stringify(findBySlug.b));

                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "OFFLINE",
                };
            }

            let response = Object.assign({EXPORT_VERSION: EXPORT_VERSION}, remaxData);

            // Geo object contains ids that change from time to time
            delete response.geo.id;
            delete response.geo.rootCount;

            return response;
        }).then(data => {
            // We have had some false positives for OFFLINE status, so dump the HTML to see what is going on.
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

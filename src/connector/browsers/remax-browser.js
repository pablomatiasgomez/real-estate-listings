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
            let response = {
                EXPORT_VERSION: "4"
            };

            let ngState = JSON.parse(document.querySelector("#ng-state").textContent);

            let remaxData = Object.values(ngState)
                .filter(v => v?.u?.includes("api/listings/findBySlug"))
                .map(v => v.b.data)
                [0];

            Object.assign(response, remaxData);

            // Geo object contains ids that change from time to time
            delete response.geo.id;
            delete response.geo.rootCount;

            return response;
        });
    }
}


// ---------

module.exports = RemaxBrowser;

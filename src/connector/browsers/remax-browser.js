'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('RemaxBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar.*\/listings\/([\w\d-]+)$/;

class RemaxBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "2"
            };

            let remaxData = JSON.parse(document.querySelector("#serverApp-state").innerHTML.replace(/&q;/g, '"'));

            let listing = remaxData["listing-detail.listing"];
            if (!listing) {
                response.status = "UNLISTED";
                return response;
            }

            Object.assign(response, listing);

            // Geo object is big and contains no interesting data that may also randomly change.
            response.geoLabel = response.geo.label;
            delete response.geo;

            response.description = response.description.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            response.pictureUrls = response.photos.map(photo => photo.value);
            delete response.photos;

            return response;
        });
    }
}


// ---------

module.exports = RemaxBrowser;

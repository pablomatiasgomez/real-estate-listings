'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('ProperatiBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/detalle\/(.+?)_.*$/;

class ProperatiBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "7"
            };

            let propertyProps = window.__NEXT_DATA__.props.pageProps.property;
            if (!propertyProps) {
                // Got not found page, property unlisted.
                response.status = "UNLISTED";
                return response;
            }

            Object.assign(response, JSON.parse(JSON.stringify(propertyProps)));

            // Many properties under seller object change too frequently. Removing it as it is not even useful info.
            delete response.seller;

            delete response.published_on;
            delete response.whatsapp_url;

            if (response.features) {
                response.features.sort((a, b) => a.category.localeCompare(b.category));
                response.features.forEach(feature => feature.features.sort((a, b) => a.key.localeCompare(b.key)));
            }

            response.tags = (response.tags || []).map(tag => tag.name);

            response.place = response.place.parent_names.join(", ");

            response.pictureUrls = (response.images || []).map(image => {
                let pictureUrl = image.sizes["1080"].jpg;
                if (!pictureUrl) throw new Error("Couldn't find picture url!");
                let match = /filters:strip_icc\(\)\/(.*)$/.exec(pictureUrl);
                if (!match || match.length !== 2) throw new Error("pictureUrl couldn't be parsed: " + pictureUrl);
                return decodeURIComponent(match[1]);
            });
            delete response.images;

            return response;
        });
    }
}


// ---------

module.exports = ProperatiBrowser;

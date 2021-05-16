'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('ProperatiBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/detalle\/(.+?)_.*$/;

/**
 * @constructor
 */
function ProperatiBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(ProperatiBrowser, SiteBrowser);

ProperatiBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "3"
        };

        Object.assign(response, JSON.parse(JSON.stringify(window.__NEXT_DATA__.props.pageProps.property)));

        delete response.seller.properties_count;
        delete response.published_on;

        if (response.features) {
            response.features.sort((a, b) => a.category.localeCompare(b.category));
            response.features.forEach(feature => feature.features.sort((a, b) => a.key.localeCompare(b.key)));
        }

        response.place = response.place.parent_names.join(", ");

        response.pictureUrls = (response.images || []).map(image => {
            let pictureUrl = image.sizes["1080"].jpg;
            if (!pictureUrl) throw "Couldn't find picture url!";
            let match = /filters:strip_icc\(\)\/(.*)$/.exec(pictureUrl);
            if (!match || match.length !== 2) throw "pictureUrl couldn't be parsed: " + pictureUrl;
            return decodeURIComponent(match[1]);
        });
        delete response.images;

        return response;
    });
};

// ---------

module.exports = ProperatiBrowser;

'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('ProperatiBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/detalle\/(.+?)_.*$/;

function ProperatiBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(ProperatiBrowser, SiteBrowser);

ProperatiBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        Object.assign(response, JSON.parse(JSON.stringify(window.__NEXT_DATA__.props.pageProps.property)));

        delete response.seller.properties_count;

        if (response.features) {
            response.features.sort((a, b) => a.category.localeCompare(b.category));
            response.features.forEach(feature => feature.features.sort((a, b) => a.key.localeCompare(b.key)));
        }

        return response;
    });
};

// ---------

module.exports = ProperatiBrowser;

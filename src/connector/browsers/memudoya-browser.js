'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('MeMudoYaBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.memudoya\.com\/propiedad\/[a-zA-Z-]+([\d-]+)$/;

/**
 * @constructor
 */
function MeMudoYaBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(MeMudoYaBrowser, SiteBrowser);

// Exported to be used in the listings search..
MeMudoYaBrowser.URL_REGEX = URL_REGEX;

MeMudoYaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        /**
         * @namespace window
         * @property {string} title
         * @property {string} propAddress
         * @property {string} operation
         * @property {Object} PAGE
         */
        let title = window.title;
        let address = window.propAddress;
        let operation = window.operation;
        let location = {
            latitude: window.PAGE.latitude,
            longitude: window.PAGE.longitude,
        };
        let description = document.querySelector("meta[property='og:description']").getAttribute('content');
        let price = document.querySelector("p.lead").innerText.split("|")[1].trim();

        return {
            EXPORT_VERSION: "0",
            title: title,
            address: address,
            operation: operation,
            location: location,
            description: description,
            price: price,
        };
    });
};

// ---------

module.exports = MeMudoYaBrowser;

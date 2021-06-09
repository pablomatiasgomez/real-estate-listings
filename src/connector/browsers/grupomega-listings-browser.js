'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('GrupoMegaListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.grupomega\.com\.ar\/propiedades\.php\?[\w&=]*&page=1&data=({.*})$/;

/**
 * @constructor
 */
function GrupoMegaListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(GrupoMegaListingsBrowser, ListingsSiteBrowser);

GrupoMegaListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".property-box")].forEach(item => {
            let url = item.querySelector("a").href;
            let id = url.split("reference_code=")[1];

            let price = item.querySelector(".price-box").innerText.trim();
            let address = item.querySelector(".title").innerText.trim();
            let location = item.querySelector(".location").innerText.trim();
            let operation = item.querySelector(".listing-badges").innerText.trim();
            let features = [...item.querySelectorAll(".facilities-list li")].map(i => i.innerText.trim().replace("\n", ": "));

            response[id] = {
                url: url,
                price: price,
                address: address,
                location: location,
                operation: operation,
                features: features,
            };
        });

        response.pages = [...document.querySelectorAll(".pagination li")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

GrupoMegaListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return listUrl.replace("page=1", "page=" + pageNumber);
};

// ---------

module.exports = GrupoMegaListingsBrowser;

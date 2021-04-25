'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('ArgenPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.argenprop\.com\/([\w-]*[a-zA-Z])$/;

/**
 * @constructor
 */
function ArgenPropListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(ArgenPropListingsBrowser, ListingsSiteBrowser);

ArgenPropListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        [...document.querySelectorAll(".listing__item")].forEach(item => {
            let url = item.querySelector("a.card").href;
            let id = url.split("--")[1];

            let price = item.querySelector(".card__price").innerText.trim();
            let address = item.querySelector(".card__address").innerText.trim();
            let title = item.querySelector(".card__title").innerText.trim();
            let features = [...item.querySelectorAll(".card__common-data span")].map(i => i.innerText.trim());
            let description = item.querySelector(".card__info").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);

            response[id] = {
                url: url,
                price: price,
                address: address,
                title: title,
                features: features,
                description: description
            };
        });

        response.pages = [...document.querySelectorAll(".pagination__page:not(.pagination__page-prev):not(.pagination__page-next)")]
            .map(a => parseInt(a.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

ArgenPropListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return `${listUrl}-pagina-${pageNumber}`;
};

// ---------

module.exports = ArgenPropListingsBrowser;

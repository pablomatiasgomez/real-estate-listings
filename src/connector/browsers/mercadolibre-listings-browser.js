'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('MercadoLibreListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/inmuebles\.mercadolibre\.com\.ar\/([\w-\/]*?)(?:_NoIndex_True)?$/;

/**
 * @constructor
 */
function MercadoLibreListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(MercadoLibreListingsBrowser, ListingsSiteBrowser);

MercadoLibreListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".ui-search-layout__item")].forEach(item => {
            let id = item.querySelector("input[name='itemId']").value;
            let price = item.querySelector(".ui-search-item__group--price .price-tag-amount").innerText.replace("\n", " ").trim();
            let features = [...item.querySelectorAll(".ui-search-item__group--attributes li")].map(li => li.innerText.trim());
            let title = item.querySelector(".ui-search-item__group--title .ui-search-item__title").innerText.trim();
            let address = item.querySelector(".ui-search-item__group--location").innerText.trim();
            let url = item.querySelector(".ui-search-link").href.split("#")[0];

            response[id] = {
                price: price,
                features: features,
                title: title,
                address: address,
                url: url,
            };
        });

        let pages = [...document.querySelectorAll(".ui-search-pagination .andes-pagination__button a")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        if (!pages.length) pages = [1];
        response.pages = pages;

        return response;
    });
};

MercadoLibreListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    let from = 48 * (pageNumber - 1) + 1;
    let filter = `_Desde_${from}`;

    let insertIndex = listUrl.lastIndexOf("/") + 1;
    if (listUrl.substring(insertIndex, insertIndex + 7) === "_Desde_") {
        throw "Original url already contained page filter!";
    }
    return listUrl.substring(0, insertIndex) + filter + listUrl.substring(insertIndex);
};

// ---------

module.exports = MercadoLibreListingsBrowser;

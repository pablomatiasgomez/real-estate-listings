'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('MercadoLibreListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/inmuebles\.mercadolibre\.com\.ar\/([\w-\/]*)_NoIndex_True$/;

function MercadoLibreListingsBrowser() {
}

MercadoLibreListingsBrowser.prototype.name = function () {
    return "MercadoLibreListings";
};

MercadoLibreListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MercadoLibreListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

MercadoLibreListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

MercadoLibreListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".ui-search-layout__item")].forEach(item => {
            let id = item.querySelector("input[name='itemId']").value;
            let price = item.querySelector(".ui-search-item__group--price").innerText.replace("\n", " ").trim();
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

        response.pages = [...document.querySelectorAll(".ui-search-pagination .andes-pagination__button a")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

MercadoLibreListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    // TODO pagination not supported for MercadoLibre,
    //  anyway the pages contain 50 items so its difficult to find a query that returns more than that..
    throw "Not supported yet!";
};


// ---------

module.exports = MercadoLibreListingsBrowser;

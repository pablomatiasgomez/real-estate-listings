'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('ProperatiListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/s\/((?:[\w:\-.]+\/){4})$/;

function ProperatiListingsBrowser() {
}

ProperatiListingsBrowser.prototype.name = function () {
    return "ProperatiListings";
};

ProperatiListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ProperatiListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ProperatiListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

ProperatiListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll("#property-list article.item")].forEach(item => {
            let id = item.getAttribute("data-id");
            let url = item.querySelector(".link.item-url").getAttribute("href");

            let price = item.querySelector(".price").innerText.trim();
            let address = item.querySelector(".address").innerText.trim();
            let features = {};
            [...item.querySelectorAll(".row-fluid div.span6 p")].forEach(feature => {
                let key = feature.className.trim() || "seller";
                let value = feature.innerText.trim();
                features[key] = value;
            });

            response[id] = {
                url: url,
                price: price,
                address: address,
                features: features,
            };
        });

        response.pages = [...document.querySelectorAll(".pagination li a")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

ProperatiListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return `${listUrl}${pageNumber}/`;
};

// ---------

module.exports = ProperatiListingsBrowser;

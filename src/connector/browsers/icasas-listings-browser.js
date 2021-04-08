'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('ICasasListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.icasas\.com\.ar\/venta\/(.+)$/;

function ICasasListingsBrowser() {
}

ICasasListingsBrowser.prototype.name = function () {
    return "ICasasListings";
};

ICasasListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ICasasListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ICasasListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

ICasasListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        [...document.querySelectorAll(".listAds .ad:not(.similar)")].forEach(item => {
            let url = item.querySelector(".detail-redirection").href;
            let id = item.querySelector("[data-adid]").getAttribute("data-adid");

            let title = item.querySelector(".title").innerText.trim();
            let price = item.querySelector(".price").innerText.trim();
            let description = item.querySelector(".description").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);

            let iconPhoto = item.querySelector(".icon.photo");
            let picturesCount = iconPhoto ? parseInt(iconPhoto.innerText) : 0;

            let features = {};
            [...item.querySelectorAll(".adCharacteristics .numbers span")].forEach(feature => {
                let key = feature.className.trim();
                let value = feature.innerText.trim();
                features[key] = value;
            });

            response[id] = {
                url: url,
                title: title,
                price: price,
                description: description,
                picturesCount: picturesCount,
                features: features,
            };
        });

        let pages = [...document.querySelectorAll(".pagination li")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        if (!pages.length) pages = [1];
        response.pages = pages;

        return response;
    });
};

ICasasListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return `${listUrl}/p_${pageNumber}`;
};

// ---------

module.exports = ICasasListingsBrowser;

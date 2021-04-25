'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('ICasasListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.icasas\.com\.ar\/venta\/(.+)$/;

/**
 * @constructor
 */
function ICasasListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(ICasasListingsBrowser, ListingsSiteBrowser);

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
                features[key] = feature.innerText.trim();
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

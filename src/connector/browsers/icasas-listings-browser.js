'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('ICasasListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.icasas\.com\.ar\/(.+)$/;

class ICasasListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "1"
            };

            // Exclude ad.similar and ad.featured which are not actual results, just suggestions.
            [...document.querySelectorAll(".listAds .ad:not(.similar):not(.featured)")].forEach(item => {
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
    }

    getListPageUrl(listUrl, pageNumber) {
        return `${listUrl}/p_${pageNumber}`;
    }
}


// ---------

module.exports = ICasasListingsBrowser;

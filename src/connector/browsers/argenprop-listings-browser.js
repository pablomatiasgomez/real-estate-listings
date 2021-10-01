'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('ArgenPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.argenprop\.com\/([\w-]*[a-zA-Z])$/;

class ArgenPropListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "2"
            };

            // Always first query the container and then the items, so that if the page loads incorrectly, we get an error instead of no results.
            [...document.querySelector(".listing__items").querySelectorAll(".listing__item")].filter(item => {
                // Some items do not have link, and other info, so we discard them..
                return !!item.querySelector("a.card");
            }).forEach(item => {
                let url = item.querySelector("a.card").href;
                let id = url.split("--")[1];

                let price = item.querySelector(".card__price").innerText.trim();
                let address = item.querySelector(".card__address").innerText.trim();
                let title = item.querySelector(".card__title").innerText.trim();
                let features = [...item.querySelectorAll(".card__common-data span")].map(i => i.innerText.trim());

                response[id] = {
                    url: url,
                    price: price,
                    address: address,
                    title: title,
                    features: features,
                };
            });

            response.pages = [...document.querySelectorAll(".pagination__page:not(.pagination__page-prev):not(.pagination__page-next)")]
                .map(a => parseInt(a.innerText))
                .filter(page => !isNaN(page));
            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return `${listUrl}-pagina-${pageNumber}`;
    }
}


// ---------

module.exports = ArgenPropListingsBrowser;

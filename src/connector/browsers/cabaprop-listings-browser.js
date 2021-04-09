'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('CabaPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/propiedades\.php\?(.+pagina=0.*)$/;

function CabaPropListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(CabaPropListingsBrowser, ListingsSiteBrowser);

CabaPropListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".house-wrapper")].forEach(item => {
            let url = item.querySelector("a").href;
            let id = url.split("id-")[1];

            let price = item.querySelector("p").innerText.trim();
            let address = item.querySelector("h5").innerText.trim();
            let features = [...item.querySelectorAll("ul li")].map(i => i.innerText.trim());
            let seller = item.querySelector(".house-holder-info").innerText.trim();

            response[id] = {
                url: url,
                price: price,
                address: address,
                features: features,
                seller: seller,
            };
        });

        response.pages = [...document.querySelectorAll(".page-item .page-link")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

CabaPropListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return listUrl.replace("pagina=0", "pagina=" + (pageNumber - 1));
};

// ---------

module.exports = CabaPropListingsBrowser;

'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('RemaxListingsBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar\/listings\/buy\?(.+)$/;

/**
 * @constructor
 */
function RemaxListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(RemaxListingsBrowser, ListingsSiteBrowser);

RemaxListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "2"
        };

        /**
         * @namespace remaxData
         * @property {Object} searchListingDomainKey
         * @property {Array} searchListingDomainKey.data[]
         * @property {number} searchListingDomainKey.totalPages
         */
        let remaxData = JSON.parse(document.querySelector("#serverApp-state").innerHTML.replace(/&q;/g, '"'));

        [...document.querySelectorAll("#listing qr-card-prop")].forEach(item => {
            let id = [...item.querySelector("#images .button-prev").classList]
                .filter(clazz => clazz.startsWith("button-prev"))
                .map(clazz => clazz.replace("button-prev", ""))
                .filter(clazz => !!clazz)
                [0];

            /**
             * @namespace data
             * @property {Object} slug
             */
            let data = remaxData.searchListingDomainKey.data.filter(item => item.id === id)[0];
            let url = location.origin + "/listings/" + data.slug;

            let price = item.querySelector("#price").innerText.trim();
            let features = [...item.querySelectorAll(".features-item p")].map(feature => {
                return feature.innerText.trim();
            });
            let pictureUrls = data.photos.map(photo => photo.value);

            delete data.photos;

            response[data.slug] = {
                url: url,
                id: id,
                price: price,
                features: features,
                pictureUrls: pictureUrls,
                data: data,
            };
        });

        response.pages = window.BrowserUtils.pageCountToPagesArray(remaxData.searchListingDomainKey.totalPages);

        return response;
    });
};

RemaxListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return listUrl.replace("page=0", "page=" + (pageNumber - 1));
};

// ---------

module.exports = RemaxListingsBrowser;

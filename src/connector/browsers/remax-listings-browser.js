'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('RemaxListingsBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar\/listings\/buy\?(.+)$/;

function RemaxListingsBrowser() {
}

RemaxListingsBrowser.prototype.name = function () {
    return "RemaxListings";
};

RemaxListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

RemaxListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

RemaxListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

RemaxListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
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

            response[data.slug] = {
                url: url,
                id: id,
                price: price,
                features: features,
                data: data,
            };
        });

        response.pages = BrowserUtils.pageCountToPagesArray(remaxData.searchListingDomainKey.totalPages);

        return response;
    });
};

RemaxListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return listUrl.replace("page=0", "page=" + (pageNumber - 1));
};

// ---------

module.exports = RemaxListingsBrowser;

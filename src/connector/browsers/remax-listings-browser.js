'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('RemaxListingsBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar\/listings\/buy\?(.+)$/;

class RemaxListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "5"
            };

            /**
             * @namespace remaxData
             * @property {Object} searchListingAndEntrepreneurshipDomainKey
             * @property {Array} searchListingAndEntrepreneurshipDomainKey.data[]
             * @property {number} searchListingAndEntrepreneurshipDomainKey.totalPages
             */
            let remaxData = JSON.parse(document.querySelector("#serverApp-state").innerHTML.replace(/&q;/g, '"'));

            remaxData.searchListingAndEntrepreneurshipDomainKey.data.forEach(item => {
                item.url = location.origin + "/listings/" + item.slug;
                delete item.photos;

                response[item.id] = item;
            });

            response.pages = window.BrowserUtils.pageCountToPagesArray(remaxData.searchListingAndEntrepreneurshipDomainKey.totalPages);

            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return listUrl.replace("page=0", "page=" + (pageNumber - 1));
    }
}


// ---------

module.exports = RemaxListingsBrowser;

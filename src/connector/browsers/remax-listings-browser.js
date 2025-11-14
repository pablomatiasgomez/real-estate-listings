'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('RemaxListingsBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar\/listings\/(.+)$/;

class RemaxListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "6"
            };

            let ngState = JSON.parse(document.querySelector("#ng-state").textContent);

            let remaxData = Object.values(ngState)
                .filter(v => v?.u?.includes("api/listings/findAll"))
                .map(v => v.b.data)
                [0];

            remaxData.data.forEach(item => {
                item.url = location.origin + "/listings/" + item.slug;
                response[item.id] = item;
            });

            response.pages = window.BrowserUtils.pageCountToPagesArray(remaxData.totalPages);

            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return listUrl.replace("page=0", "page=" + (pageNumber - 1));
    }
}


// ---------

module.exports = RemaxListingsBrowser;

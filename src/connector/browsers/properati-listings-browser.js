'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('ProperatiListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/s\/([\w:\-\/]+)$/;

/**
 * @constructor
 */
function ProperatiListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(ProperatiListingsBrowser, ListingsSiteBrowser);

ProperatiListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "11"
        };

        let nextData = JSON.parse(document.querySelector("#__NEXT_DATA__").innerText);

        let results = nextData.props.pageProps.results;

        results.data.forEach(item => {
            item.url = location.origin + "/detalle/" + item.url_name;
            item.place = item.place.parent_names.join(", ");
            item.picturesCount = (item.images || []).length;
            delete item.images;
            delete item.score;
            delete item.created_on;
            delete item.published_on;
            delete item.highlighted;

            // These fields are returning flaky results although they shouldn't..
            delete item.maintenance_fees;
            delete item.surface;

            response[item.id] = item;
        });

        let pageCount = Math.ceil(results.metadata.total / results.metadata.limit);
        response.pages = window.BrowserUtils.pageCountToPagesArray(pageCount);

        return response;
    });
};

ProperatiListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    if (listUrl.includes("page=")) throw new Error("listUrl already contains pagination!");
    let appendChar = listUrl.includes("?") ? "&" : "?";
    return `${listUrl}${appendChar}page=${pageNumber}`;
};

// ---------

module.exports = ProperatiListingsBrowser;

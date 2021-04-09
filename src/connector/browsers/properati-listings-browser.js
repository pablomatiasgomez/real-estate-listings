'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('ProperatiListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/s\/([\w:\-\/]+)$/;

function ProperatiListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(ProperatiListingsBrowser, ListingsSiteBrowser);

ProperatiListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "6"
        };

        let nextData = JSON.parse(document.querySelector("#__NEXT_DATA__").innerText);

        let results = nextData.props.pageProps.results;

        results.data.forEach(item => {
            item.url = location.origin + "/detalle/" + item.url_name;
            item.pictureUrls = (item.images || []).map(image => {
                let pictureUrl = image.sizes["1080"].jpg;
                if (!pictureUrl) throw "Couldn't find picture url!";
                let match = /filters:strip_icc\(\)\/(.*)$/.exec(pictureUrl);
                if (!match || match.length !== 2) throw "pictureUrl couldn't be parsed: " + pictureUrl;
                return decodeURIComponent(match[1]);
            });
            delete item.images;
            delete item.score;

            response[item.id] = item;
        });

        let pageCount = Math.ceil(results.metadata.total / results.metadata.limit);
        response.pages = window.BrowserUtils.pageCountToPagesArray(pageCount);

        return response;
    });
};

ProperatiListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    if (listUrl.includes("page=")) throw "listUrl already contains pagination!";
    let appendChar = listUrl.includes("?") ? "&" : "?";
    return `${listUrl}${appendChar}page=${pageNumber}`;
};

// ---------

module.exports = ProperatiListingsBrowser;

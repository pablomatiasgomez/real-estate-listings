'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('ProperatiListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/s\/([\w:\-\/]+)$/;

function ProperatiListingsBrowser() {
}

ProperatiListingsBrowser.prototype.name = function () {
    return "ProperatiListings";
};

ProperatiListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ProperatiListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ProperatiListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

ProperatiListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "5"
        };

        let nextData = JSON.parse(document.querySelector("#__NEXT_DATA__").innerText);

        let results = nextData.props.pageProps.results;

        results.data.forEach(item => {
            item.url = location.origin + "/detalle/" + item.url_name;
            item.pictureUrls = (item.images || []).map(image => {
                let pictureUrl = image.sizes["1080"].jpg;
                if (!pictureUrl) throw "Couldn't find picture url!";
                return pictureUrl;
            });
            delete item.images;
            delete item.score;

            response[item.id] = item;
        });

        let pageCount = Math.ceil(results.metadata.total / results.metadata.limit);
        response.pages = BrowserUtils.pageCountToPagesArray(pageCount);

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

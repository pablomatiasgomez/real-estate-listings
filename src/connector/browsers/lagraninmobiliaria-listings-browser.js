'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('LaGranInmobiliariaListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/lagraninmobiliaria\.com\/venta\/([\w\-\/]+)(?<!\d-p)$/; // jshint ignore:line

function LaGranInmobiliariaListingsBrowser() {
}

LaGranInmobiliariaListingsBrowser.prototype.name = function () {
    return "LaGranInmobiliariaListings";
};

LaGranInmobiliariaListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

LaGranInmobiliariaListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

LaGranInmobiliariaListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

LaGranInmobiliariaListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        let queryStates = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));
        if (Object.values(queryStates).length !== 1) throw "Do not know how to handle more than 1 elements!";
        let queryState = Object.values(queryStates)[0].body;

        // noinspection JSUnresolvedVariable
        queryState.listings.forEach(listing => {
            listing.url = location.origin + "/" + listing.url;
            response[listing.id] = listing;
        });

        response.pages = Array.from(Array(queryState.pages.total + 1).keys()).slice(1);

        return response;
    });
};

LaGranInmobiliariaListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return `${listUrl}/${pageNumber}-p`;
};

// ---------

module.exports = LaGranInmobiliariaListingsBrowser;
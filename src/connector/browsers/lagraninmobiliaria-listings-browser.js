'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('LaGranInmobiliariaListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/lagraninmobiliaria\.com\/venta\/([\w\-\/]+)(?<!\d-p)$/; // jshint ignore:line

function LaGranInmobiliariaListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(LaGranInmobiliariaListingsBrowser, ListingsSiteBrowser);

LaGranInmobiliariaListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        let queryStates = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));
        if (Object.values(queryStates).length !== 1) throw "Do not know how to handle more than 1 elements!";
        let queryState = Object.values(queryStates)[0].body;

        queryState.listings.forEach(item => {
            item.url = location.origin + "/" + item.url;
            item.pictureUrls = (item.photos || []).map(photo => {
                if (!photo.hd) throw "Couldn't find picture url!";
                return photo.hd;
            });
            delete item.photos;

            response[item.id] = item;
        });

        response.pages = window.BrowserUtils.pageCountToPagesArray(queryState.pages.total);

        return response;
    });
};

LaGranInmobiliariaListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return `${listUrl}/${pageNumber}-p`;
};

// ---------

module.exports = LaGranInmobiliariaListingsBrowser;

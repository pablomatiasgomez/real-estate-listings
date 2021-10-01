'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('LaGranInmobiliariaListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/lagraninmobiliaria\.com\/venta\/([\w\-\/]+)(?<!\d-p)$/; // jshint ignore:line

class LaGranInmobiliariaListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "1"
            };

            let queryStates = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));
            if (Object.values(queryStates).length !== 1) throw new Error("Do not know how to handle more than 1 elements!");
            let queryState = Object.values(queryStates)[0].body;

            queryState.listings.forEach(item => {
                item.url = location.origin + "/" + item.url;
                item.pictureUrls = (item.photos || []).map(photo => {
                    if (!photo.hd) throw new Error("Couldn't find picture url!");
                    return photo.hd;
                });
                delete item.photos;

                response[item.id] = item;
            });

            response.pages = window.BrowserUtils.pageCountToPagesArray(queryState.pages.total);

            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return `${listUrl}/${pageNumber}-p`;
    }
}


// ---------

module.exports = LaGranInmobiliariaListingsBrowser;

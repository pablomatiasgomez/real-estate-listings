'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('MudafyListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/mudafy\.com\.ar\/venta\/(.+)$/;

class MudafyListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "0"
            };

            let data = JSON.parse(JSON.stringify(window.__remixContext.routeData["routes/__layout-full/venta.$propertyType.*/index"].listings));
            if (data.next) throw new Error("More than 1 pages not implemented for Mudafy yet!");
            response.pages = [1];

            let allLinks = [...document.querySelectorAll("a.location")].map(a => a.href);
            data.results.forEach(item => {
                item.url = allLinks.filter(link => link.includes(item.slug))[0];
                item.location = item.location.name;

                item.pictureUrls = item.photos.map(photo => photo.image.medium);
                delete item.photos;

                delete item.score;
                delete item.score2;
                delete item.metrics_info;
                delete item.dated_id;

                response[item.id] = item;
            });

            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        throw new Error("Not supported yet!");
    }
}


// ---------

module.exports = MudafyListingsBrowser;

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
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "0"
            };

            let mudafyData = JSON.parse(document.querySelector("#mfy-trinity-state").innerHTML.replace(/&q;/g, '"'));

            let data = Object.entries(mudafyData)
                .filter(entry => entry[0].startsWith("G.https://chat-noir.mudafy.com/listings/infinite-supply?"))
                .map(entry => entry[1].body)
                [0];

            if (data.next) throw new Error("More than 1 pages not implemented for Mudafy yet!");
            response.pages = [1];


            data.results.forEach(item => {
                item.url = document.querySelector(`[data-id="${item.id}"]`).querySelector("a").href;
                item.location = item.location.name;

                item.pictureUrls = item.photos.map(photo => photo.image.medium);
                delete item.photos;

                delete item.score;
                delete item.score2;
                delete item.metrics_info.question_count;

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

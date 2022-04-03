'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('LaGranInmobiliariaBrowser');

//---------------

const URL_REGEX = /^https:\/\/lagraninmobiliaria\.com\/(\d+)-.*$/;

class LaGranInmobiliariaBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "2";

            let id = location.href.split("-")[0].split("/")[3];
            let data = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));

            let listingApiData = data[`G.https://api.lagraninmobiliaria.com/api/getlisting/id/${id}?`];
            if (!listingApiData) {
                if (Object.keys(data).length === 1 && Object.keys(data)[0].startsWith(`G.https://api.lagraninmobiliaria.com/api/getlistings`)) {
                    // Redirected to listings, listing no longer found
                    let status = "UNLISTED";
                    return {
                        EXPORT_VERSION: EXPORT_VERSION,
                        status: status,
                    };
                } else {
                    throw new Error(`Unknown state! Data keys: ${Object.keys(data)}`);
                }
            }

            let response = {
                EXPORT_VERSION: EXPORT_VERSION,
            };
            Object.assign(response, listingApiData.body);

            response.pictureUrls = (response.photos || []).map(photo => {
                if (!photo.hd) throw new Error("Couldn't find picture url!");
                return photo.hd;
            });
            delete response.photos;

            return response;
        });
    }
}


// ---------

module.exports = LaGranInmobiliariaBrowser;

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
            let response = {
                EXPORT_VERSION: "2"
            };

            let id = location.href.split("-")[0].split("/")[3];
            let data = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));
            Object.assign(response, data[`G.https://api.lagraninmobiliaria.com/api/getlisting/id/${id}?`].body);

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

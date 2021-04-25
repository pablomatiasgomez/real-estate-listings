'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('LaGranInmobiliariaBrowser');

//---------------

const URL_REGEX = /^https:\/\/lagraninmobiliaria\.com\/(\d+)-.*$/;

/**
 * @constructor
 */
function LaGranInmobiliariaBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(LaGranInmobiliariaBrowser, SiteBrowser);

LaGranInmobiliariaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "2"
        };

        let id = location.href.split("-")[0].split("/")[3];
        let data = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));
        Object.assign(response, data[`G.https://api.lagraninmobiliaria.com/api/getlisting/id/${id}?`].body);

        response.pictureUrls = (response.photos || []).map(photo => {
            if (!photo.hd) throw "Couldn't find picture url!";
            return photo.hd;
        });
        delete response.photos;

        return response;
    });
};

// ---------

module.exports = LaGranInmobiliariaBrowser;

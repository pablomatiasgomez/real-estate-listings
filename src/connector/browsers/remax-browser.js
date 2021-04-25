'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('RemaxBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.remax\.com\.ar.*\/listings\/([\w\d-]+)$/;

/**
 * @constructor
 */
function RemaxBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(RemaxBrowser, SiteBrowser);

RemaxBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        let remaxData = JSON.parse(document.querySelector("#serverApp-state").innerHTML.replace(/&q;/g, '"'));

        let listing = remaxData["listing-detail.listing"];
        if (!listing) throw "Couldn't find listing data!";
        Object.assign(response, listing);

        response.description = response.description.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
        response.pictureUrls = response.photos.map(photo => photo.value);
        delete response.photos;

        return response;
    });
};

// ---------

module.exports = RemaxBrowser;

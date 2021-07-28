'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('GrupoMegaBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.grupomega\.com\.ar\/propiedad\.php\?reference_code=(\w+)$/;

/**
 * @constructor
 */
function GrupoMegaBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(GrupoMegaBrowser, SiteBrowser);

GrupoMegaBrowser.prototype.logHtmlOnError = function () {
    return true;
};

GrupoMegaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "0";

        if (document.querySelector(".breadcrumb-area h1").innerText.trim() === "PROPIEDAD NO DISPONIBLE") {
            let status = "UNLISTED";
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: status,
            };
        }

        let address = document.querySelector(".heading-properties-3 h1").innerText.trim();
        let price = document.querySelector(".property-price").innerText.trim();
        let operation = document.querySelector(".rent").innerText.trim();
        let description = document.querySelector(".properties-description > div").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);

        let features = {};
        let tds = [...document.querySelectorAll(".floor-plans table tr td")];
        for (let i = 0; i < tds.length / 2; i++) {
            let key = tds[i].innerText.trim();
            features[key] = tds[i + tds.length / 2].innerText.trim();
        }

        let amenities = [...document.querySelectorAll(".amenities li")].map(li => li.innerText.trim());
        let pictureUrls = [...document.querySelectorAll("#propertiesDetailsSlider img")].map(img => img.src);

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            address: address,
            price: price,
            operation: operation,
            description: description,
            features: features,
            amenities: amenities,
            pictureUrls: pictureUrls,
        };
    });
};

// ---------

module.exports = GrupoMegaBrowser;

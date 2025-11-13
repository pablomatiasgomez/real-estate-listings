'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('GrupoMegaBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.grupomega\.com\.ar\/propiedad\.php\?reference_code=(\w+)$/;

class GrupoMegaBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "0";

            let breadcrumbTitle = document.querySelector(".breadcrumb-area h1");
            if (breadcrumbTitle && breadcrumbTitle.innerText.trim() === "PROPIEDAD NO DISPONIBLE") {
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
    }
}


// ---------

module.exports = GrupoMegaBrowser;

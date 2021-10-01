'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('VarcasiaBrowser');

//---------------

const URL_REGEX = /^https:\/\/varcasiapropiedades\.com\.ar\/propiedades\/(.+)\/$/;

class VarcasiaBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "1";

            if (document.querySelector(".mh-404")) {
                // Got not found page, property unlisted
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "UNLISTED"
                };
            }

            let title = document.querySelector(".mh-top-title__heading").innerText.trim();
            let price = document.querySelector(".mh-estate__details__price__single").innerText;
            let features = {};
            [...document.querySelectorAll(".mh-estate__list li")].map(li => {
                let keyValue = li.innerText.split(":").map(i => i.trim());
                features[keyValue[0]] = keyValue[1];
            });
            let description = [...document.querySelectorAll(".mh-estate__section")].filter(section => {
                let heading = section.querySelector(".mh-estate__section__heading");
                return heading && heading.innerText.trim() === "DESCRIPCIÓN";
            }).map(section => {
                return section.querySelector("p").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            })[0];

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                title: title,
                price: price,
                features: features,
                description: description,
            };
        });
    }
}


// ---------

module.exports = VarcasiaBrowser;

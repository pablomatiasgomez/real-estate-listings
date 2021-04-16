'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('VarcasiaBrowser');

//---------------

const URL_REGEX = /^https:\/\/varcasiapropiedades\.com\.ar\/propiedades\/(.+)\/$/;

function VarcasiaBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(VarcasiaBrowser, SiteBrowser);

VarcasiaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "1";

        let titleEl = document.querySelector(".mh-top-title__heading");
        if (!titleEl) {
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: "UNLISTED"
            };
        }

        let title = titleEl.innerText.trim();
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
};

// ---------

module.exports = VarcasiaBrowser;

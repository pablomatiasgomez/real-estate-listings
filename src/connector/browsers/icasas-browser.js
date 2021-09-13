'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('ICasasBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.icasas\.com\.ar\/inmueble\/(\d+)$/;

/**
 * @constructor
 */
function ICasasBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(ICasasBrowser, SiteBrowser);

ICasasBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "3";

        let status = "LISTED";

        if (document.querySelector(".not-available-container")) {
            // The listing is still visible but no longer available
            status = "UNAVAILABLE";
        } else if (document.querySelector(".listado .viviendas")) {
            // The listing is nos longer visible nor available
            status = "UNLISTED";
            let title = document.querySelector(".listado .viviendas .titulo").innerText;

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: status,
                title: title,
            };
        }

        let title = document.querySelector("#firstLine h1").innerText;
        let subtitle = document.querySelector("#firstLine h2").innerText;
        let price = document.querySelector(".price").innerText;
        let address = document.querySelector(".location_info").innerText;

        let descriptionReadMoreEl = document.querySelector(".description .read_more");
        if (descriptionReadMoreEl) {
            // Remove show more and show the extra description.
            descriptionReadMoreEl.remove();
            document.querySelector(".more_text").style.display = "";
        }
        let description = document.querySelector(".description").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);

        let features = {};
        [...document.querySelectorAll(".list li")].forEach(li => {
            let keyValue = li.innerText.split(":");
            features[keyValue[0].trim()] = keyValue.length === 2 ? keyValue[1].trim() : true;
        });
        [...document.querySelectorAll(".details_list li")].forEach(li => {
            features[li.className.trim()] = li.innerText.trim();
        });

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            status: status,
            title: title,
            subtitle: subtitle,
            price: price,
            address: address,
            description: description,
            features: features,
        };
    });
};

// ---------

module.exports = ICasasBrowser;

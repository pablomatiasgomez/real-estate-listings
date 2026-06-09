'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('ProperatiBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/detalle\/(.+?)$/;

class ProperatiBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "8"
            };

            // Properati no longer ships a __NEXT_DATA__ blob. The detail page is now server-rendered
            // HTML and the data has to be read straight from the DOM.
            let detail = document.querySelector(".adform__detail");
            let title = document.querySelector(".main-title h1");
            if (!detail || !title) {
                // Got not found page, property unlisted.
                response.status = "UNLISTED";
                return response;
            }

            response.title = title.innerText.trim();
            response.location = document.querySelector(".row-details .left-details .location")?.innerText.trim() || null;

            // Price lives in a div that also holds a nested period (e.g. "/mes"). Read the leading
            // text node for the amount and the nested element for the period separately.
            let priceEl = document.querySelector('[data-test="listing-price"]');
            if (priceEl) {
                response.price = priceEl.firstChild?.textContent.trim() || null;
                response.pricePeriod = priceEl.querySelector(".prices-and-fees__month")?.innerText.trim() || null;
            }

            // Features: main place details (bedrooms, bathrooms, area, ...) plus the property specs
            // (property type, operation type, construction year, ...), keyed by their data-test name.
            response.features = {};
            [
                ...document.querySelectorAll(".row-details .place-details .details-item-value[data-test]"),
                ...document.querySelectorAll(".place-features .place-features__values[data-test]"),
            ].forEach(el => {
                let key = el.getAttribute("data-test").replace(/-value$/, "");
                response.features[key] = el.innerText.trim();
            });

            let descEl = document.getElementById("description-text");
            response.description = descEl ? descEl.innerText.split("\n").map(l => l.trim()).filter(l => !!l) : [];

            response.agency = document.querySelector('[data-test="agency-name"]')?.innerText.trim() || null;

            return response;
        });
    }
}


// ---------

module.exports = ProperatiBrowser;

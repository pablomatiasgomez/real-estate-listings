'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('MenendezPropListingsBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.menendezprop\.com\.ar\/resultado\.aspx\?(.*)$/;

/**
 * @constructor
 */
function MenendezPropListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(MenendezPropListingsBrowser, ListingsSiteBrowser);

MenendezPropListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        let items;
        let noResultsH1 = document.querySelector("h1.bread");
        if (noResultsH1 && noResultsH1.innerText.trim() === "No hay resultados. Por favor realice una nueva búsqueda.") {
            // No results
            items = [];
        } else {
            items = [...document.querySelectorAll(".resultado_datos")];
            // Sometimes the page may not load correctly so we need to validate it this way:
            // We either receive a "no results" error, or we have results. Otherwise, the page was not fully loaded.
            if (!items.length) throw "Something wrong happened, no error and no results!";
        }

        items.forEach(itemData => {
            let item = itemData.parentNode;
            let id = item.querySelector(".resultado_iinfo").getAttribute("onclick").split("'")[1];

            let title = item.querySelector(".resultado_iinfo").innerText.trim();
            let price = item.querySelector(".resultados_precio").innerText.trim();
            let pictureUrl = item.querySelector(".resultado_imagen img").src;

            let description = null;
            let features = {};
            [...item.querySelectorAll(".resultado_datos div")].forEach(descriptionEl => {
                if (descriptionEl.className === "sub_resultado_datos") {
                    description = descriptionEl.innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
                } else if (descriptionEl.className.startsWith("sub_resultado_datos")) {
                    descriptionEl.innerText.split("\n").forEach(feature => {
                        let split = feature.split(":");
                        features[split[0].trim()] = split[1].trim();
                    });
                }
            });

            response[id] = {
                title: title,
                price: price,
                pictureUrl: pictureUrl,
                description: description,
                features: features,
            };
        });

        response.pages = [...document.querySelector(".pagination").children]
            .filter(el => el.offsetParent !== null) // Not hidden
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        if (!response.pages.length) response.pages = [1];

        return response;
    });
};

MenendezPropListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    // TODO pagination not supported for MenendezProp, (cannot be done via url change, only via ajax)
    throw "Not supported yet!";
};

// ---------

module.exports = MenendezPropListingsBrowser;

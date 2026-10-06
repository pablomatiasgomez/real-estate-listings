'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('CabaPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/propiedad\/([0-9a-f]+)(?:\/.*)?$/;

class CabaPropBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        // The listing is rendered client side, wait until it is there (or until the "not found" page is shown).
        return browserPage.waitForFunction(() => {
            return document.title.startsWith("Propiedad no encontrada") ||
                document.querySelector(".listing-title-area .media-body h2");
        }, {timeout: 60 * 1000}).then(() => browserPage.evaluate(async () => {
            // Removed properties render a "not found" page instead of the listing.
            if (document.title.startsWith("Propiedad no encontrada")) {
                return {
                    EXPORT_VERSION: "4",
                    status: "UNLISTED",
                };
            }

            let tabContent = () => document.querySelector(".property_sp_v8_tabs .tab-content");

            // Details and extras are tabs that are only rendered once clicked.
            let openTab = async tabName => {
                let tab = [...document.querySelectorAll(".property_sp_v8_tabs .custom-link")]
                    .find(link => link.innerText.trim() === tabName);
                if (!tab) return null;
                tab.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                return tabContent();
            };

            // Each group is a column with an h4 title and "Key: Value" (or just "Key") items.
            let extractGroups = (container, groups) => {
                if (!container) return groups;
                container.querySelectorAll("h4").forEach(h4 => {
                    groups[h4.innerText.trim()] = [...h4.parentNode.querySelectorAll("li")].reduce((group, li) => {
                        let keyValue = li.innerText.split(":").map(i => i.trim());
                        group[keyValue[0]] = keyValue[1] || true;
                        return group;
                    }, {});
                });
                return groups;
            };

            let headerColumns = document.querySelectorAll(".listing-title-area .container .col-12 > .row > div");
            let title = document.querySelector(".listing-title-area .media-body h2").innerText.trim();
            let type = headerColumns[0].querySelector("h5").innerText.trim();
            let address = headerColumns[0].querySelector("h5 + div p").innerText.trim();
            let mainFeatures = [...headerColumns[0].querySelectorAll("ul li")].map(li => li.innerText.trim());
            let price = headerColumns[1].querySelector("h3").innerText.replace("Precio:", "").trim();
            let operation = headerColumns[1].querySelector("span.d-block").innerText.trim();
            let description = tabContent().querySelector(".listing_single_description").innerText
                .replace(/^Descripción/, "")
                .split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let pictureUrls = [...document.querySelectorAll(".gallery-slider img.gallery-img")].map(img => img.src);

            let features = extractGroups(await openTab("DETALLES"), {});
            features = extractGroups(await openTab("EXTRAS"), features);

            return {
                EXPORT_VERSION: "4",
                status: "LISTED",
                title: title,
                type: type,
                operation: operation,
                address: address,
                price: price,
                mainFeatures: mainFeatures,
                description: description,
                features: features,
                pictures: pictureUrls,
            };
        }));
    }
}


// ---------

module.exports = CabaPropBrowser;

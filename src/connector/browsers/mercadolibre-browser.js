'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('MercadoLibreBrowser');

//---------------

const URL_REGEX = /^https?:\/\/.*.mercadolibre\.com\.ar\/MLA-(\d+)-.*$/;

class MercadoLibreBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    logHtmlOnError() {
        return true;
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "6";

            function findScript(strMatch) {
                let scripts = [...document.getElementsByTagName("script")]
                    .filter(script => script.innerText.indexOf(strMatch) !== -1);

                if (scripts.length !== 1) throw new Error("Found " + scripts.length + " scripts! Expected 1!");
                return scripts[0].innerText;
            }

            if (document.querySelector(".ui-search")) {
                // Redirected to search view.
                // No data was found (probably got redirected and the house no longer exists)
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "OFFLINE",
                };
            } else if (document.querySelector(".ui-pdp-container--pdp")) {
                // There are many ".ui-pdp-container" but the one that has the "--pdp" is the valid one.
                let container = document.querySelector(".ui-pdp-container--pdp");

                let statusEl = container.querySelector(".ui-pdp-message");
                let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

                let title = container.querySelector(".ui-pdp-title").innerText.trim();
                let description = container.querySelector(".ui-pdp-description__content").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
                let price = container.querySelector(".ui-pdp-price").innerText.split("\n").slice(1).join(" ").trim();

                // TODO remove this replacemente once the legacy version is no longer used.
                let address = container.querySelector(".ui-vip-location__subtitle p").innerText.replace(", Capital Federal, Capital Federal", ", Capital Federal").trim();

                // TODO this is not the same as previous version, but impossible to map.
                // let seller = document.querySelector(".ui-vip-profile-info h3").innerText.trim();
                let gaScript = findScript("dimension120");
                let seller = /meli_ga\("set", "dimension120", "(.*)"\)/.exec(gaScript)[1];

                let features = [...container.querySelectorAll(".ui-pdp-specs__table table tr")].reduce((features, tr) => {
                    features[tr.querySelector("th").innerText.trim()] = tr.querySelector("td").innerText.trim();
                    return features;
                }, {});
                let pictureUrls = [...container.querySelectorAll(".ui-pdp-gallery .ui-pdp-gallery__column img.ui-pdp-image.ui-pdp-gallery__figure__image")]
                    .map(i => i.getAttribute("data-zoom"));

                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: status,
                    title: title,
                    description: description,
                    price: price,
                    address: address,
                    seller: seller,
                    features: features,
                    pictureUrls: pictureUrls,
                };
            } else {
                throw new Error("Couldn't find any valid element!");
            }
        });
    }
}

// ---------

module.exports = MercadoLibreBrowser;

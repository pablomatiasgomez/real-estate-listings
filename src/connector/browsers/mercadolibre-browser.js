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
            let EXPORT_VERSION = "8";

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
            } else if (document.querySelector(".ui-pdp-container")) {
                // There are many ".ui-pdp-container" but the one that has the "--pdp" (or --top) is the valid one.
                // If --pdp is present, use that one, otherwise it looks like a mobile view, that has the --top present.
                let container = document.querySelector(".ui-pdp-container.ui-pdp-container--pdp");
                if (!container) container = document.querySelector(".ui-pdp-container.ui-pdp-container--top");
                if (!container) throw new Error("Couldn't find valid container!");

                let statusEl = container.querySelector(".ui-pdp-message");
                let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

                let title = container.querySelector(".ui-pdp-title").innerText.trim();
                // let description = container.querySelector(".ui-pdp-description__content")?.innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
                let price = container.querySelector(".ui-pdp-price").innerText.split("\n").slice(1).join(" ").trim();
                // Seems that some listings don't display the address, but the API still provides it... Eventually could be grabbed it from there.
                // skipped for now
                // let address = container.querySelector(".ui-vip-location__subtitle p")?.innerText.trim();
                let seller = container.querySelector(".ui-vip-profile-info h3").innerText.trim();

                let gaScript = findScript("dimension120");
                let listingType = /meli_ga\("set", "dimension19", "(.*)"\)/.exec(gaScript)[1];
                let sellerKind = /meli_ga\("set", "dimension35", "(.*)"\)/.exec(gaScript)[1];
                let sellerId = /meli_ga\("set", "dimension120", "(.*)"\)/.exec(gaScript)[1];

                // skipped for now
                // let features = [...container.querySelectorAll(".ui-pdp-specs__table table tr")].reduce((features, tr) => {
                //     features[tr.querySelector("th").innerText.trim()] = tr.querySelector("td").innerText.trim();
                //     return features;
                // }, {});

                let pictureUrls = [
                    ...container.querySelectorAll(".ui-pdp-gallery img.ui-pdp-image.ui-pdp-gallery__figure__image"),
                    ...container.querySelectorAll(".ui-pdp-gallery img.ui-pdp-image.ui-pdp-gallery--horizontal"),
                ].map(i => i.getAttribute("data-zoom") || (i.getAttribute("data-src") || i.getAttribute("src")).replace("-O.webp", "-F.webp"));

                // address, description and features removed for now as they are flaky (appear and disappear)
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: status,
                    title: title,
                    // description: description,
                    price: price,
                    // address: address,
                    seller: seller,
                    sellerKind: sellerKind,
                    sellerId: sellerId,
                    listingType: listingType,
                    // features: features,
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

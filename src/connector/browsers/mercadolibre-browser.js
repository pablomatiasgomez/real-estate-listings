'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('MercadoLibreBrowser');

//---------------

const URL_REGEX = /^https?:\/\/.*.mercadolibre\.com\.ar\/MLA-(\d+)-.*$/;

class MercadoLibreBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    detectBotBlock(browserPage) {
        return super.detectBotBlock(browserPage).then(blockReason => {
            if (blockReason) return blockReason;
            return browserPage.evaluate(() => {
                if (window.location.pathname.startsWith("/gz/account-verification")) return "MercadoLibre account verification";
                // "Por seguridad, completá este paso" page, served by the abuse-captcha frontend.
                if (document.documentElement.dataset.assetsPrefix?.includes("abuse-captcha")) return "MercadoLibre captcha";
                return null;
            });
        });
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "8";

            // Item data sent to MercadoLibre's own analytics: melidata("add","event_data",{...});
            function getEventData() {
                let scripts = [...document.scripts].filter(script => script.textContent.includes('melidata("add","event_data",'));
                if (scripts.length !== 1) throw new Error("Found " + scripts.length + " event_data scripts! Expected 1!");
                let match = /melidata\("add","event_data",(\{.*?\})\);(?:melidata|$)/s.exec(scripts[0].textContent);
                if (!match) throw new Error("Couldn't parse event_data!");
                return JSON.parse(match[1]);
            }

            if (
                document.querySelector(".ui-search") ||                       // Redirected to search view (probably got redirected as the listing no longer exists)
                document.querySelector("main#root-app > .ui-pdp-not-found")   // No data was found
            ) {
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

                let eventData = getEventData();
                // item_status is e.g. "active" or "paused". The ".ui-pdp-message" banners are not used as there can be unrelated ones (e.g. seller reputation).
                let status = eventData.item_status === "active" ? "ONLINE" : eventData.item_status.toUpperCase();

                let title = container.querySelector(".ui-pdp-title").innerText.trim();
                // let description = container.querySelector(".ui-pdp-description__content")?.innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
                let price = eventData.price != null ? `${eventData.currency_id} ${eventData.price}` : null;
                // Seems that some listings don't display the address, but the API still provides it... Eventually could be grabbed it from there.
                // skipped for now
                // let address = container.querySelector(".ui-vip-location__subtitle p")?.innerText.trim();
                let seller = container.querySelector(".ui-vip-profile-info h3").innerText.trim();

                let listingType = eventData.listing_type_id;
                let sellerKind = eventData.seller_type;
                let sellerId = String(eventData.seller_id);

                // skipped for now
                // let features = [...container.querySelectorAll(".ui-pdp-specs__table table tr")].reduce((features, tr) => {
                //     features[tr.querySelector("th").innerText.trim()] = tr.querySelector("td").innerText.trim();
                //     return features;
                // }, {});

                // All gallery pictures are "img.ui-pdp-image" (with an optional --vertical/--horizontal orientation modifier).
                // The carousel repeats some of them, so they are deduped.
                let pictureUrls = [...new Set([...container.querySelectorAll(".ui-pdp-gallery img.ui-pdp-image")]
                    .map(i => i.getAttribute("data-zoom") || (i.getAttribute("data-src") || i.getAttribute("src")).replace("-O.webp", "-F.webp")))];

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

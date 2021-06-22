'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('MercadoLibreBrowser');

//---------------

const URL_REGEX = /^https?:\/\/.*.mercadolibre\.com\.ar\/MLA-(\d+)-.*$/;

/**
 * @constructor
 */
function MercadoLibreBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(MercadoLibreBrowser, SiteBrowser);

MercadoLibreBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "5";

        function findScript(strMatch) {
            let scripts = [...document.getElementsByTagName("script")]
                .filter(script => script.innerText.indexOf(strMatch) !== -1);

            if (scripts.length !== 1) throw "Found " + scripts.length + " scripts! Expected 1!";
            return scripts[0].innerText;
        }

        if (document.querySelector(".vip-section-product-info")) {
            // This is the new version of MELI listings...

            let statusEl = document.querySelector(".item-status-notification .item-status-title");
            let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

            throw "TODO: handle title element.";
            let title = "TODO!"; // jshint ignore:line
            let description = document.querySelector(".description-content .preformated-text").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let price = document.querySelector(".vip-price").innerText.trim();
            let address = document.querySelector(".vip-section-map h2").innerText.trim();

            let gaScript = findScript("dimension120");
            let seller = /meli_ga\("set", "dimension120", "(.*)"\)/.exec(gaScript)[1];

            let features = {};
            [...document.querySelectorAll(".attribute-content .attribute-group li")].forEach(li => {
                let keyValue = li.innerText.split(":").map(i => i.trim());
                features[keyValue[0]] = keyValue[1] || true;
            });

            let pictureUrlsScript = findScript("items = [");
            let pictureUrls = JSON.parse(/items = (.*),\n/.exec(pictureUrlsScript)[1])
                .map(picture => picture.src.replace("none", ""));

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
        } else if (document.querySelector(".item-title")) {
            // Legacy version of MELI listings....
            // TODO Deprecate once no longer used...
            // throw "Legacy version still used?!";

            let statusEl = document.querySelector(".layout-description-wrapper .item-status-notification__title");
            let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

            let title = document.querySelector(".item-title").innerText.trim();
            let description = document.querySelector("#description-includes").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let price = document.querySelector(".item-price").innerText.replace("\n", " ").trim();
            let address = document.querySelector(".seller-location").innerText.replace("\n", ", ").trim();

            /*
            let agency = document.querySelector(".vip-section-seller-info #real_estate_agency");
            let privateSeller = document.querySelector(".vip-section-seller-info .card-description");
            let seller = agency ? agency.innerText.trim() : privateSeller.innerText.trim();
            */
            let gaScript = findScript("dimension120");
            let seller = /meli_ga\("set", "dimension120", "(.*)"\)/.exec(gaScript)[1];

            let features = {};
            [...document.querySelectorAll(".specs-item")].forEach(li => {
                let keyValue = li.innerText.split("\n").map(i => i.trim());
                features[keyValue[0]] = keyValue[1] || true;
            });
            let pictureUrls = JSON.parse(document.querySelector("#gallery_dflt .gallery-content").getAttribute("data-full-images"))
                .map(picture => picture.src)
                .map(pictureUrl => {
                    let match = pictureUrl.match(/https:\/\/http2.mlstatic\.com\/(.*)D_NQ_NP_/);
                    if (match.length !== 2) throw "Invalid picture url! " + pictureUrl;
                    let perfix = "https://http2.mlstatic.com/";
                    return perfix + pictureUrl.substr(perfix.length + match[1].length, pictureUrl.length);
                });

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
        } else if (document.querySelector(".ui-pdp-title")) {
            // Legacy, but updated version of MELI listings....

            let statusEl = document.querySelector(".ui-pdp-container--pdp .ui-pdp-message");
            let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

            let title = document.querySelector(".ui-pdp-container--pdp .ui-pdp-title").innerText.trim();
            let description = document.querySelector(".ui-pdp-container--pdp .ui-pdp-description__content").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let price = document.querySelector(".ui-pdp-container--pdp .price-tag-amount").innerText.replace("\n", " ").trim();
            let address = document.querySelector(".ui-pdp-container--pdp .ui-vip-location__subtitle").innerText.replace(", Capital Federal, Capital Federal", ", Capital Federal").trim();

            // TODO this is not the same as previous version, but impossible to map.
            // let seller = document.querySelector(".ui-vip-profile-info h3").innerText.trim();
            let gaScript = findScript("dimension120");
            let seller = /meli_ga\("set", "dimension120", "(.*)"\)/.exec(gaScript)[1];

            let features = [...document.querySelectorAll(".ui-pdp-container--pdp .ui-pdp-specs__table table tr")].reduce((features, tr) => {
                features[tr.querySelector("th").innerText.trim()] = tr.querySelector("td").innerText.trim();
                return features;
            }, {});
            let pictureUrls = [...document.querySelectorAll(".ui-pdp-container--pdp .ui-pdp-gallery .ui-pdp-gallery__column img.ui-pdp-image.ui-pdp-gallery__figure__image")]
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
        } else if (document.querySelector(".ui-search")) {
            // Redirected to search view.
            // No data was found (probably got redirected and the house no longer exists)
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: "OFFLINE",
            };
        } else {
            throw "Couldn't find any valid element! HTML: \n " + document.getElementsByTagName("html")[0].innerHTML;
        }
    });
};

// ---------

module.exports = MercadoLibreBrowser;

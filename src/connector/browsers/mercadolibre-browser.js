'use strict';

const logger = include('utils/logger').newLogger('MercadoLibreBrowser');

//---------------

const URL_REGEX = /^https?:\/\/.*.mercadolibre\.com\.ar\/MLA-(\d+)-.*$/;

function MercadoLibreBrowser() {
}

MercadoLibreBrowser.prototype.name = function () {
    return "MercadoLibre";
};

MercadoLibreBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MercadoLibreBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

MercadoLibreBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "1";

        let titleEl = document.querySelector(".item-title__primary");
        if (!titleEl) {
            // No data was found (probably got redirected and the house no longer exists)
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: "OFFLINE",
            };
        }

        let statusEl = document.querySelector(".layout-description-wrapper .item-status-notification__title");
        let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

        let title = titleEl.innerText.trim();
        let description = document.querySelector("#description-includes").innerText.trim();
        let price = document.querySelector(".item-price").innerText.replace("\n", " ").trim();
        let address = document.querySelector(".seller-location").innerText.replace("\n", " ").trim();
        let seller = document.querySelector("#real_estate_agency").innerText.trim();
        let features = {};
        [...document.querySelectorAll(".specs-item")].forEach(li => {
            let keyValue = li.innerText.split("\n").map(i => i.trim());
            features[keyValue[0]] = keyValue[1] || true;
        });
        let pictures = JSON.parse(document.querySelector("#gallery_dflt .gallery-content").getAttribute("data-full-images"));

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            status: status,
            title: title,
            description: description,
            price: price,
            address: address,
            seller: seller,
            features: features,
            pictures: pictures,
        };
    });
};

// ---------

module.exports = MercadoLibreBrowser;

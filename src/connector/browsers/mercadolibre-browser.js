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

        if (document.querySelector(".vip-section-product-info")) {
            // This is the new version of MELI listings...

            // TODO handle "Publicación finalizada" status.
            let status = "ONLINE";

            let fullAddress = document.querySelector(".vip-section-map h2").innerText.trim();

            let title = fullAddress.substr(0, fullAddress.lastIndexOf(",")); // Legacy title didn't include last past of address...
            let description = document.querySelector(".description-content .preformated-text").innerText.trim();
            let price = document.querySelector(".vip-price").innerText.trim();
            let address = fullAddress.replace(",", ""); // Legacy address didn't include the first ","
            let seller = document.querySelector("#sellerContact .profile-info-name-data").innerText.trim();
            let features = {};
            [...document.querySelectorAll(".attribute-content .attribute-group li")].forEach(li => {
                let keyValue = li.innerText.split(":").map(i => i.trim());
                features[keyValue[0]] = keyValue[1] || true;
            });

            let pictureUrlsScript = [...document.getElementsByTagName("script")]
                .filter(script => script.innerText.indexOf("items = [") !== -1)
                [0]
                .innerText;
            let pictures = JSON.parse(/items = (.*),\n/.exec(pictureUrlsScript)[1]);
            let itemKey = /\.com\/(.*)-D_NQ/.exec(JSON.parse(document.querySelector("script[type='application/ld+json']").innerText).image)[1];
            pictures.forEach(picture => picture.src = picture.src.replace("none", itemKey));

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
        } else if (document.querySelector(".item-title__primary")) {
            // Legacy version of MELI listings....

            let statusEl = document.querySelector(".layout-description-wrapper .item-status-notification__title");
            let status = statusEl ? statusEl.innerText.trim() : "ONLINE";

            let title = document.querySelector(".item-title__primary").innerText.trim();
            let description = document.querySelector("#description-includes").innerText.trim();
            let price = document.querySelector(".item-price").innerText.replace("\n", " ").trim();
            let address = document.querySelector(".seller-location").innerText.replace("\n", " ").trim();

            let agency = document.querySelector(".vip-section-seller-info #real_estate_agency");
            let privateSeller = document.querySelector(".vip-section-seller-info .card-description");
            let seller = agency ? agency.innerText.trim() : privateSeller.innerText.trim();

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
        } else {
            // If none of the two versions are found, it means we were redirected to the home page..
            // No data was found (probably got redirected and the house no longer exists)
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: "OFFLINE",
            };
        }
    });
};

// ---------

module.exports = MercadoLibreBrowser;

'use strict';

const logger = include('utils/logger').newLogger('MercadolibreListingBrowser');

//---------------

const URL_REGEX = /^https?:\/\/.*.mercadolibre\.com\.ar\/MLA-(\d+)-.*$/;

function MercadolibreListingBrowser() {
}

MercadolibreListingBrowser.prototype.name = function () {
    return "MercadoLibreListing";
};

MercadolibreListingBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MercadolibreListingBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

MercadolibreListingBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        if (!document.getElementsByClassName("item-title__primary")[0]) {
            // No data was found (probably got redirected and the house no longer exists?)
            return response;
        }

        // Title
        let title = document.getElementsByClassName("item-title__primary")[0].innerText;
        response.title = title;

        // Description
        let description = document.getElementById("description-includes").innerText;
        response.description = description;

        // Price
        let price = document.getElementsByClassName("item-price")[0].innerText.replace("\n", " ");
        response.price = price;

        // Location
        let address = document.getElementsByClassName("seller-location")[0].innerText.replace("\n", " ");
        response.address = address;

        // Property features
        [...document.getElementsByClassName("specs-item")].forEach(li => {
            let keyValue = li.innerText.split("\n").map(i => i.trim());
            response[keyValue[0]] = keyValue[1] || true;
        });

        // Pictures
        let pictureUrls = [...document.querySelectorAll("#gallery_dflt img")].map(img => {
            return img.src;
        });
        response.pictures = pictureUrls;

        return response;
    });
};

// ---------

module.exports = MercadolibreListingBrowser;

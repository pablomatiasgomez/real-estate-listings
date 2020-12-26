'use strict';

const logger = include('utils/logger').newLogger('MercadoLibreBrowser');

//---------------

const URL_REGEX = /^https?:\/\/.*.mercadolibre.com.ar\/MLA-(\d+)-.*$/;

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

MercadoLibreBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url);
    }).then(() => {
        return browserPage.evaluate(() => {
            let response = {};

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
    }).delay(1000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    }).delay(1000);
};

// ---------

module.exports = MercadoLibreBrowser;

'use strict';

const logger = include('utils/logger').newLogger('CabaPropBrowser');

//---------------

const URL_REGEX = /^https?:\/\/cabaprop.com.ar\/.+-(\d+)$/;

function CabaPropBrowser() {
}

CabaPropBrowser.prototype.name = function () {
    return "CabaProp";
};

CabaPropBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

CabaPropBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

CabaPropBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url);
    }).then(() => {
        return browserPage.evaluate(() => {
            let response = {};

            // Location
            let address = document.querySelector(".pro-head h6").innerText;
            response.address = address;

            // Price
            let price = document.querySelector(".pro-head .price").innerText;
            response.price = price;

            // Description
            let description = document.querySelector(".pro-text").innerText;
            response.description = description;

            // Property features
            [...document.querySelectorAll(".pro-details-item .features li")].forEach(li => {
                let keyValue = li.innerText.split(":").map(i => i.trim());
                response[keyValue[0]] = keyValue[1] || true;
            });

            // Pictures
            let pictureUrls = [...document.querySelectorAll(".slick-list img")]
                .map(img => img.src);
            response.pictures = pictureUrls;

            return response;
        });
    }).delay(1000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    }).delay(1000);
};

// ---------

module.exports = CabaPropBrowser;

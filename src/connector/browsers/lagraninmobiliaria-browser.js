'use strict';

const logger = include('utils/logger').newLogger('LaGranInmobiliariaBrowser');

//---------------

const URL_REGEX = /^https?:\/\/lagraninmobiliaria.com\/(\d+)-.*$/;

function LaGranInmobiliariaBrowser() {
}

LaGranInmobiliariaBrowser.prototype.name = function () {
    return "LaGranInmobiliaria";
};

LaGranInmobiliariaBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

LaGranInmobiliariaBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

LaGranInmobiliariaBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url, {waitUntil: 'load', timeout: 60 * 1000});
    }).delay(5000).then(() => {
        return browserPage.evaluate(() => {
            let response = {};

            // Title
            let title = document.querySelector("h1[_ngcontent-euclides-lgi-c4]").innerText;
            response.title = title;

            // Description
            let description = document.querySelector(".description").innerText;
            response.description = description;

            // Property features
            let keys = document.querySelectorAll(".details dt");
            let values = document.querySelectorAll(".details dd");
            if (keys.length !== values.length) {
                throw "keys and values length differ!";
            }
            for (let i = 0; i < keys.length; i++) {
                response[keys[i].innerText.trim()] = values[i].innerText.trim();
            }

            // Location
            let googleUrl = document.querySelector(".location iframe").src;
            response.location = googleUrl;

            // Price
            let price = document.querySelector(".quick-info h2").innerText;
            response.price = price;

            // Other quick features
            [...document.querySelectorAll(".quick-info-items span.prop-quickinfo")].forEach(item => {
                response[item.id] = item.innerText;
            });

            // Pictures
            let pictureUrls = [...document.querySelectorAll(".photos img")].map(img => {
                return img.src || img.getAttribute("data-src");
            });
            response.pictures = pictureUrls;

            return response;
        });
    }).delay(3000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    });
};

// ---------

module.exports = LaGranInmobiliariaBrowser;

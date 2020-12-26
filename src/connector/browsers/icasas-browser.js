'use strict';

const logger = include('utils/logger').newLogger('ICasasBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.icasas.com.ar\/inmueble\/(\d+)$/;

function ICasasBrowser() {
}

ICasasBrowser.prototype.name = function () {
    return "ICasas";
};

ICasasBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ICasasBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ICasasBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url, {waitUntil: 'load', timeout: 60 * 1000});
    }).delay(5000).then(() => {
        return browserPage.evaluate(() => {
            let response = {};

            // Title
            let title = document.querySelector("#firstLine h1").innerText;
            response.title = title;
            let subtitle = document.querySelector("#firstLine h2").innerText;
            response.subtitle = subtitle;

            // Description
            let description = document.querySelector(".description").innerText;
            response.description = description;

            // Price
            let price = document.querySelector(".price").innerText;
            response.price = price;

            // Location
            let address = document.querySelector(".location_info").innerText;
            response.address = address;

            // Pictures
            let picturesSlider = document.querySelector(".slick-track");
            if (picturesSlider) {
                let pictureUrls = [...picturesSlider.querySelectorAll("img")].map(img => {
                    return img.getAttribute("data-lazy") || img.src;
                });
                response.pictures = pictureUrls;
            }

            // Property features
            [...document.querySelectorAll(".list li")].forEach(li => {
                response[li.innerText.trim()] = true;
            });
            [...document.querySelectorAll(".details_list li")].forEach(li => {
                response[li.className.trim()] = li.innerText.trim();
            });

            return response;
        });
    }).delay(3000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    });
};

// ---------

module.exports = ICasasBrowser;

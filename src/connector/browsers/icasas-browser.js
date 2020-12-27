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

ICasasBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

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
};

// ---------

module.exports = ICasasBrowser;

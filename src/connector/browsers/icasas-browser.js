'use strict';

const logger = include('utils/logger').newLogger('ICasasBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.icasas\.com\.ar\/inmueble\/(\d+)$/;

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
        let EXPORT_VERSION = "1";

        let status = "LISTED";

        if (document.querySelector(".not-available-container")) {
            // The listing is still visible but no longer available
            status = "UNAVAILABLE";
        } else if (document.querySelector(".listado .viviendas")) {
            // The listing is nos longer visible nor available
            status = "UNLISTED";
            let title = document.querySelector(".listado .viviendas .titulo").innerText;

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: status,
                title: title,
            };
        }

        let title = document.querySelector("#firstLine h1").innerText;
        let subtitle = document.querySelector("#firstLine h2").innerText;
        let price = document.querySelector(".price").innerText;
        let address = document.querySelector(".location_info").innerText;

        let picturesSlider = document.querySelector(".slick-track");
        let pictureUrls = [];
        if (picturesSlider) {
            pictureUrls = [...picturesSlider.querySelectorAll("img")].map(img => {
                return img.getAttribute("data-lazy") || img.src;
            });
        }

        let descriptionReadMoreEl = document.querySelector(".description .read_more");
        if (descriptionReadMoreEl) {
            // Remove show more and show the extra description.
            descriptionReadMoreEl.remove();
            document.querySelector(".more_text").style.display = "";
        }
        let description = document.querySelector(".description").innerText;

        let features = {};
        [...document.querySelectorAll(".list li")].forEach(li => {
            let keyValue = li.innerText.split(":");
            features[keyValue[0].trim()] = keyValue.length === 2 ? keyValue[1].trim() : true;
        });
        [...document.querySelectorAll(".details_list li")].forEach(li => {
            features[li.className.trim()] = li.innerText.trim();
        });

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            status: status,
            title: title,
            subtitle: subtitle,
            price: price,
            address: address,
            description: description,
            features: features,
            pictureUrls: pictureUrls,
        };
    });
};

// ---------

module.exports = ICasasBrowser;

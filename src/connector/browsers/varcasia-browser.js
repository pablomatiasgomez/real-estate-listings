'use strict';

const logger = include('utils/logger').newLogger('VarcasiaBrowser');

//---------------

const URL_REGEX = /^https?:\/\/varcasiapropiedades.com.ar\/propiedades\/(.+)\/$/;

function VarcasiaBrowser() {
}

VarcasiaBrowser.prototype.name = function () {
    return "Varcasia";
};

VarcasiaBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

VarcasiaBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

VarcasiaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // Title
        let title = document.querySelector(".mh-top-title__heading").innerText.trim();
        response.title = title;

        // Price
        let price = document.querySelector(".mh-estate__details__price__single").innerText;
        response.price = price;

        // Features
        [...document.querySelectorAll(".mh-estate__list li")].map(li => {
            let keyValue = li.innerText.split(":").map(i => i.trim());
            response[keyValue[0]] = keyValue[1];
        });

        // Description
        let description = [...document.querySelectorAll(".mh-estate__section")].filter(section => {
            let heading = section.querySelector(".mh-estate__section__heading");
            return heading && heading.innerText.trim() === "DESCRIPCIÓN";
        }).map(section => {
            return section.querySelector("p").innerText;
        })[0];
        response.description = description;

        return response;
    });
};

// ---------

module.exports = VarcasiaBrowser;

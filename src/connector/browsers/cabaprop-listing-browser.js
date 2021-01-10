'use strict';

const logger = include('utils/logger').newLogger('CabaPropListingBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/.+-id-(\d+)$/;

function CabaPropListingBrowser() {
}

CabaPropListingBrowser.prototype.name = function () {
    return "CabaPropListing";
};

CabaPropListingBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

CabaPropListingBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

CabaPropListingBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

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
        let pictureUrls = [...document.querySelectorAll(".slick-list .slick-slide:not(.slick-cloned) img")]
            .map(img => img.src);
        response.pictures = pictureUrls;

        return response;
    });
};

// ---------

module.exports = CabaPropListingBrowser;

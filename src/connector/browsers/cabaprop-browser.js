'use strict';

const logger = include('utils/logger').newLogger('CabaPropBrowser');

//---------------

const LISTING_URL_REGEX = /^https:\/\/cabaprop.com.ar\/.+-id-(\d+)$/;
const LISTINGS_URL_REGEX = /^https:\/\/cabaprop.com.ar\/propiedades\.php\?(.+orden=\w+.+)$/;

function CabaPropBrowser() {
    this.extractDataFns = [
        {
            regex: LISTING_URL_REGEX,
            fn: this.extractListingData,
        },
        {
            regex: LISTINGS_URL_REGEX,
            fn: this.extractListData,
        },
    ];
}

CabaPropBrowser.prototype.name = function () {
    return "CabaProp";
};

CabaPropBrowser.prototype.acceptsUrl = function (url) {
    return this.extractDataFns.some(entry => entry.regex.test(url));
};

CabaPropBrowser.prototype.getId = function (url) {
    return this.extractDataFns
        .map(entry => entry.regex.exec(url))
        .filter(match => match && match.length === 2)
        .map(match => match[1])
        [0];
};

CabaPropBrowser.prototype.extractData = function (browserPage) {
    let self = this;

    return self.extractDataFns
        .filter(entry => entry.regex.test(browserPage.url()))
        .map(entry => entry.fn.call(self, browserPage))
        [0];
};

CabaPropBrowser.prototype.extractListingData = function (browserPage) {
    logger.info(`Extracting listing data...`);

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

// TODO currently does not handle more than 1 page
CabaPropBrowser.prototype.extractListData = function (browserPage) {
    logger.info(`Extracting list data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".house-wrapper")].forEach(item => {
            let id = item.querySelector("a").href.split("id-")[1];

            let price = item.querySelector("p").innerText.trim();
            let address = item.querySelector("h5").innerText.trim();
            let features = [...item.querySelectorAll("ul li")].map(i => i.innerText.trim());
            let seller = item.querySelector(".house-holder-info").innerText.trim();

            response[id] = {
                price: price,
                address: address,
                features: features,
                seller: seller,
            };
        });

        return response;
    });
};

// ---------

module.exports = CabaPropBrowser;

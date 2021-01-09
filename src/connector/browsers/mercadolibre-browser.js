'use strict';

const logger = include('utils/logger').newLogger('MercadoLibreBrowser');

//---------------

const LISTING_URL_REGEX = /^https?:\/\/.*.mercadolibre.com.ar\/MLA-(\d+)-.*$/;
const LISTINGS_URL_REGEX = /^https:\/\/inmuebles\.mercadolibre.com.ar\/([\w-\/]*)_NoIndex_True$/;

function MercadoLibreBrowser() {
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

MercadoLibreBrowser.prototype.name = function () {
    return "MercadoLibre";
};

MercadoLibreBrowser.prototype.acceptsUrl = function (url) {
    return this.extractDataFns.some(entry => entry.regex.test(url));
};

MercadoLibreBrowser.prototype.getId = function (url) {
    return this.extractDataFns
        .map(entry => entry.regex.exec(url))
        .filter(match => match && match.length === 2)
        .map(match => match[1])
        [0];
};

MercadoLibreBrowser.prototype.extractData = function (browserPage) {
    let self = this;

    return self.extractDataFns
        .filter(entry => entry.regex.test(browserPage.url()))
        .map(entry => entry.fn.call(self, browserPage))
        [0];
};

MercadoLibreBrowser.prototype.extractListingData = function (browserPage) {
    logger.info(`Extracting listing data...`);

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

// TODO currently does not handle more than 1 page
MercadoLibreBrowser.prototype.extractListData = function (browserPage) {
    logger.info(`Extracting list data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".ui-search-layout__item")].forEach(item => {
            let id = item.querySelector("input[name='itemId']").value;
            let price = item.querySelector(".ui-search-item__group--price").innerText.replace("\n", " ").trim();
            let features = [...item.querySelectorAll(".ui-search-item__group--attributes li")].map(li => li.innerText.trim());
            let title = item.querySelector(".ui-search-item__group--title .ui-search-item__title").innerText.trim();
            let address = item.querySelector(".ui-search-item__group--location").innerText.trim();
            let url = item.querySelector(".ui-search-link").href.split("#")[0];

            response[id] = {
                price: price,
                features: features,
                title: title,
                address: address,
                url: url,
            };
        });

        return response;
    });
};

// ---------

module.exports = MercadoLibreBrowser;

'use strict';

const logger = include('utils/logger').newLogger('ArgenPropBrowser');

//---------------

const LISTING_URL_REGEX = /^https:\/\/www.argenprop.com\/.*--(\d+)$/;
const LISTINGS_URL_REGEX = /^https:\/\/www.argenprop.com\/([\w-]*-orden-(?:\w-?)*)$/;

function ArgenPropBrowser() {
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

ArgenPropBrowser.prototype.name = function () {
    return "ArgenProp";
};

ArgenPropBrowser.prototype.acceptsUrl = function (url) {
    return this.extractDataFns.some(entry => entry.regex.test(url));
};

ArgenPropBrowser.prototype.getId = function (url) {
    return this.extractDataFns
        .map(entry => entry.regex.exec(url))
        .filter(match => match && match.length === 2)
        .map(match => match[1])
        [0];
};

ArgenPropBrowser.prototype.extractData = function (browserPage) {
    let self = this;

    return self.extractDataFns
        .filter(entry => entry.regex.test(browserPage.url()))
        .map(entry => entry.fn.call(self, browserPage))
        [0];
};

ArgenPropBrowser.prototype.extractListingData = function (browserPage) {
    logger.info(`Extracting listing data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // Title
        let title = document.getElementById("ShareDescription").value;
        response.title = title;

        // Description
        let description = document.getElementById("text-responsive-ficha").innerText;
        response.description = description;

        // Parse some private information from GA tag
        let gaElement = document.getElementById("ga-dimension-ficha");
        if (gaElement) {
            let ignoredAttributes = [
                "tracker-statistics",
                "tracker-statistics-url",
                "data-fecha-visita",
            ];
            let attributes = gaElement.attributes;
            for (let i = 0; i < attributes.length; i++) {
                let key = attributes[i].nodeName;
                if (key.startsWith("data-") && !ignoredAttributes.includes(key)) {
                    response[key.slice(5)] = attributes[i].nodeValue;
                }
            }
        }

        // Property features
        [...document.getElementsByClassName("property-features")].flatMap(ul => {
            return [...ul.getElementsByTagName("li")];
        }).forEach(li => {
            let keyValue = li.innerText.split(":").map(i => i.trim());
            response[keyValue[0]] = keyValue[1] || true;
        });

        // Pictures
        let pictureUrls = [...document.querySelectorAll("ul[data-carousel] img")].map(img => {
            return img.src || img.getAttribute("data-src");
        });
        response.pictures = pictureUrls;

        // Location
        let address = document.querySelector(".titlebar__address").innerText;
        response.address = address;

        return response;
    });
};

// TODO currently does not handle more than 1 page
ArgenPropBrowser.prototype.extractListData = function (browserPage) {
    logger.info(`Extracting list data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".listing__item")].forEach(item => {
            let id = item.querySelector("a.card").href.split("--")[1];

            let price = item.querySelector(".card__price").innerText.trim();
            let address = item.querySelector(".card__address").innerText.trim();
            let title = item.querySelector(".card__title").innerText.trim();
            let features = [...item.querySelectorAll(".card__common-data span")].map(i => i.innerText.trim());
            let description = item.querySelector(".card__info").innerText.trim();

            response[id] = {
                price: price,
                address: address,
                title: title,
                features: features,
                description: description
            };
        });

        return response;
    });
};

// ---------

module.exports = ArgenPropBrowser;

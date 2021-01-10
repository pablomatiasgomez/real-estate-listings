'use strict';

const logger = include('utils/logger').newLogger('ArgenpropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www.argenprop.com\/([\w-]*-orden-(?:\w-?)*)$/;

function ArgenpropListingsBrowser() {
}

ArgenpropListingsBrowser.prototype.name = function () {
    return "ArgenpropListings";
};

ArgenpropListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ArgenpropListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

// TODO currently does not handle more than 1 page
ArgenpropListingsBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

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

module.exports = ArgenpropListingsBrowser;

'use strict';

const logger = include('utils/logger').newLogger('CabaPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com.ar\/propiedades\.php\?(.+orden=\w+.+)$/;

function CabaPropListingsBrowser() {
}

CabaPropListingsBrowser.prototype.name = function () {
    return "CabaPropListings";
};

CabaPropListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

CabaPropListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

// TODO currently does not handle more than 1 page
CabaPropListingsBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

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

module.exports = CabaPropListingsBrowser;

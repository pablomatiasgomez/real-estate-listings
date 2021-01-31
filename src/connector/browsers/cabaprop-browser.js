'use strict';

const logger = include('utils/logger').newLogger('CabaPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/.+-id-(\d+)$/;

function CabaPropBrowser() {
}

CabaPropBrowser.prototype.name = function () {
    return "CabaProp";
};

CabaPropBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

CabaPropBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

CabaPropBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let address = document.querySelector(".pro-head h6").innerText;
        let price = document.querySelector(".pro-head .price").innerText;
        let description = document.querySelector(".pro-text").innerText;
        let features = [...document.querySelectorAll(".pro-details-item .features li")].reduce((features, li) => {
            let keyValue = li.innerText.split(":").map(i => i.trim());
            features[keyValue[0]] = keyValue[1] || true;
            return features;
        }, {});
        let pictureUrls = [...document.querySelectorAll(".slick-list .slick-slide:not(.slick-cloned) img")]
            .map(img => img.src);

        return {
            EXPORT_VERSION: "2",
            address: address,
            price: price,
            description: description,
            features: features,
            pictures: pictureUrls,
        };
    });
};

// ---------

module.exports = CabaPropBrowser;

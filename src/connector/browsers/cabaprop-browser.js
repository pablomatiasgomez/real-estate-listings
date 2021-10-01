'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('CabaPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/.+-id-(\d+)$/;

class CabaPropBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let address = document.querySelector(".pro-head h6").innerText;
            let price = document.querySelector(".pro-head .price").innerText;
            let description = document.querySelector(".pro-text").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let features = [...document.querySelectorAll(".pro-details-item .features li")].reduce((features, li) => {
                let keyValue = li.innerText.split(":").map(i => i.trim());
                features[keyValue[0]] = keyValue[1] || true;
                return features;
            }, {});
            let pictureUrls = [...document.querySelectorAll(".slick-list .slick-slide:not(.slick-cloned) img")]
                .map(img => img.src);

            return {
                EXPORT_VERSION: "3",
                address: address,
                price: price,
                description: description,
                features: features,
                pictures: pictureUrls,
            };
        });
    }
}


// ---------

module.exports = CabaPropBrowser;

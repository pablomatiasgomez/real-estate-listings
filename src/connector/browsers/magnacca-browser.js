'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('MagnaccaBrowser');

//---------------

const URL_REGEX = /^https:\/\/magnaccapatelli\.com\/detalle_propiedad\.php\?id=(\d+)$/;

class MagnaccaBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "1";

            let title = document.querySelector(".lista-prop h2").innerText.trim();
            if (title === "") {
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "UNLISTED",
                };
            }

            let features = {};
            [...document.querySelectorAll(".lista-prop #datos_prop p")].forEach(feature => {
                let keyValue = feature.innerText.split(":");
                features[keyValue[0].trim()] = keyValue[1].trim();
            });
            let description = document.querySelector(".lista-prop #descripcion").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let pictureUrls = [...document.querySelectorAll(".lista-prop .carousel .item img")].map(img => img.src);

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                title: title,
                features: features,
                description: description,
                pictureUrls: pictureUrls,
            };
        });
    }
}


// ---------

module.exports = MagnaccaBrowser;

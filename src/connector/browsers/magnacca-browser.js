'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('MagnaccaBrowser');

//---------------

const URL_REGEX = /^https:\/\/magnaccapatelli\.com\/detalle_propiedad\.php\?id=(\d+)$/;

/**
 * @constructor
 */
function MagnaccaBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(MagnaccaBrowser, SiteBrowser);

MagnaccaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let title = document.querySelector(".lista-prop h2").innerText.trim();
        let features = {};
        [...document.querySelectorAll(".lista-prop #datos_prop p")].forEach(feature => {
            let keyValue = feature.innerText.split(":");
            features[keyValue[0].trim()] = keyValue[1].trim();
        });
        let description = document.querySelector(".lista-prop #descripcion").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
        let pictureUrls = [...document.querySelectorAll(".lista-prop .carousel .item img")].map(img => img.src);

        return {
            EXPORT_VERSION: "1",
            title: title,
            features: features,
            description: description,
            pictureUrls: pictureUrls,
        };
    });
};

// ---------

module.exports = MagnaccaBrowser;

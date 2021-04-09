'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('LiderPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/liderprop\.com\/es-ar\/propiedades\/(\d+)\/[\w\-]*\/$/;

function LiderPropBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(LiderPropBrowser, SiteBrowser);

LiderPropBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "0";

        let titleEl = document.querySelector("header p");
        if (!titleEl) {
            // Page shows a 404 error html..
            let status = "UNLISTED";
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: status,
            };
        }

        let title = titleEl.innerText.trim();
        let description = document.querySelector(".panel-body p").innerText.trim();
        let price = document.querySelector(".price").innerText.trim();
        let seller = document.querySelector(".agency .panel-heading").innerText.trim();

        let features = {};
        [
            ...document.querySelectorAll(".main ul.row-2 li"),
            ...document.querySelectorAll(".main ul.row-3 li"),
            ...document.querySelectorAll(".panel-body ul.type-1 li"),
        ].forEach(li => {
            let key = li.childNodes[0].nodeValue.trim();
            features[key] = li.childNodes[1].innerText.trim();
        });
        [...document.querySelectorAll(".panel-body ul.type-2 li")].forEach(li => {
            let key = li.innerText.trim();
            features[key] = true;
        });

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            title: title,
            description: description,
            price: price,
            seller: seller,
            features: features,
        };
    });
};

// ---------

module.exports = LiderPropBrowser;

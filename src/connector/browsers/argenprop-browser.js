'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('ArgenPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.argenprop\.com\/.*--(\d+)$/;

class ArgenPropBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "1";

            // Two 404 options. An html page that shows that the ad is no longer listed, and a simple text page that prints "Aviso no encontrado"
            if (document.querySelector(".error-404-bg") || document.querySelector("body > pre")?.innerText === "Aviso no encontrado") {
                let status = "UNLISTED";
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: status,
                };
            }

            let title = document.getElementById("ShareDescription").value;
            let description = document.querySelector(".section-description--content").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let price = document.querySelector(".titlebar__price").innerText;
            let address = document.querySelector(".titlebar__address").innerText;

            // Parse some private information from GA tag
            let extraData = {};
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
                        extraData[key.slice(5)] = attributes[i].nodeValue;
                    }
                }
            }

            let features = {};
            [...document.getElementsByClassName("property-features")].flatMap(ul => {
                return [...ul.getElementsByTagName("li")];
            }).forEach(li => {
                let keyValue = li.innerText.split(":").map(i => i.trim());
                features[keyValue[0]] = keyValue[1] || true;
            });

            let pictureUrls = [...document.querySelectorAll("ul.gallery-content li img")].map(img => {
                return img.src || img.getAttribute("data-src");
            });

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                title: title,
                description: description,
                price: price,
                address: address,
                extraData: extraData,
                features: features,
                pictures: pictureUrls,
            };
        });
    }
}

// ---------

module.exports = ArgenPropBrowser;

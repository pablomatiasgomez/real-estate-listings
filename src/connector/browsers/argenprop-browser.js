'use strict';

const logger = include('utils/logger').newLogger('ArgenPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.argenprop\.com\/.*--(\d+)$/;

function ArgenPropBrowser() {
}

ArgenPropBrowser.prototype.name = function () {
    return "ArgenProp";
};

ArgenPropBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ArgenPropBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ArgenPropBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "1";

        let titleEl = document.getElementById("ShareDescription");
        if (!titleEl) {
            // Page shows a 404 error html..
            let status = "UNLISTED";
            return {
                EXPORT_VERSION: EXPORT_VERSION,
                status: status,
            };
        }

        let title = titleEl.value;
        let description = document.getElementById("text-responsive-ficha").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
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

        let pictureUrls = [...document.querySelectorAll("ul[data-carousel] img")].map(img => {
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
};

// ---------

module.exports = ArgenPropBrowser;

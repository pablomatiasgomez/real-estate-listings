'use strict';

const logger = include('utils/logger').newLogger('ArgenPropListingBrowser');

//---------------

const URL_REGEX = /^https:\/\/www.argenprop\.com\/.*--(\d+)$/;

function ArgenPropListingBrowser() {
}

ArgenPropListingBrowser.prototype.name = function () {
    return "ArgenPropListing";
};

ArgenPropListingBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ArgenPropListingBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ArgenPropListingBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

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

// ---------

module.exports = ArgenPropListingBrowser;

'use strict';

const logger = include('utils/logger').newLogger('RemaxBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.remax.com.ar.*\/([\d-]+)$/;

function RemaxBrowser() {
}

RemaxBrowser.prototype.name = function () {
    return "Remax";
};

RemaxBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

RemaxBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

RemaxBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {};
        if (!document.getElementsByClassName("key-title").length) {
            // The page is no longer available, probably the property was taken down.
            return response;
        }

        // Title, price, address, id
        let keysToLookup = [
            "title",
            "price",
            "address",
            "other",
            "id",
        ];
        keysToLookup.forEach(key => {
            let items = document.getElementsByClassName("key-" + key);
            if (items.length === 1) {
                response[key] = items[0].innerText.trim();
            } else if (items.length > 1) {
                for (let i = 0; i < items.length; i++) {
                    response[key + i] = items[i].innerText.trim();
                }
            }
        });

        // Description
        let description = document.querySelector("div[itemprop='description']").innerText.trim();
        response.description = description;

        // Features
        [...document.querySelectorAll(".data-item-row")].forEach(row => {
            let key = row.querySelector(".data-item-label").innerText.replace(":", "").trim();
            let value = row.querySelector(".data-item-value").innerText.trim();
            response[key] = value;
        });
        [...document.querySelectorAll(".feature-item")].forEach(item => {
            let key = item.innerText.trim();
            response[key] = true;
        });


        // Pictures
        let pictureAlts = [...document.querySelectorAll(".gallery-map-images img.sp-image")].map(img => {
            return img.getAttribute("alt");
        });
        response.pictures = pictureAlts;

        return response;
    });
};

// ---------

module.exports = RemaxBrowser;

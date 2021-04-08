'use strict';

const logger = include('utils/logger').newLogger('EnBuenosAiresBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.enbuenosaires\.com\/venta\/.*-(\d+).html$/;

function EnBuenosAiresBrowser() {
}

EnBuenosAiresBrowser.prototype.name = function () {
    return "EnBuenosAires";
};

EnBuenosAiresBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

EnBuenosAiresBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

EnBuenosAiresBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "1";

        let titleEl = document.querySelector(".container h1:not(#main_header)");

        if (!titleEl) {
            // No data was found (probably got redirected and the house no longer exists?)
            return {
                EXPORT_VERSION: EXPORT_VERSION,
            };
        }

        let title = titleEl.innerText;

        // Description & features
        let description = "";
        let features = {};
        [...document.querySelectorAll(".clearfloats .row")].forEach(row => {
            let infoList = row.querySelector(".info_list");
            if (infoList) {
                let keys = infoList.querySelectorAll("dt");
                let values = infoList.querySelectorAll("dd");
                if (keys.length !== values.length) {
                    throw "keys and values length differ!";
                }
                for (let i = 0; i < keys.length; i++) {
                    features[keys[i].innerText.trim()] = values[i].innerText.trim();
                }
            }

            let isDescription = !!row.querySelector("p[itemprop='description']");
            if (isDescription) {
                description = row.querySelectorAll("p")[1].innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            }
        });

        let pictureUrls = [...document.querySelectorAll(".gallery img")].map(img => {
            return img.getAttribute("data-lazy") || img.src;
        }).filter(pictureUrl => {
            return pictureUrl.indexOf("AbstractDefaultAjaxBehavior") === -1;
        });

        let priceHistory = [...document.querySelectorAll("#stats li")].map(li => {
            return {
                date: li.querySelector("span").innerText.trim(),
                price: li.querySelector("strong").innerText.trim()
            };
        });

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            title: title,
            description: description,
            features: features,
            pictureUrls: pictureUrls,
            priceHistory: priceHistory,
        };
    });
};

// ---------

module.exports = EnBuenosAiresBrowser;

'use strict';

const logger = include('utils/logger').newLogger('EnBuenosAiresBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.enbuenosaires.com\/venta\/.*-(\d+).html$/;

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

EnBuenosAiresBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url, {waitUntil: 'load', timeout: 60 * 1000});
    }).delay(5000).then(() => {
        return browserPage.evaluate(() => {
            let response = {};

            // Title
            let title = document.getElementsByTagName("h1")[0].innerText;
            response.title = title;

            // Description & features
            [...document.querySelectorAll(".clearfloats .row")].forEach(row => {
                let infoList = row.querySelector(".info_list");
                if (infoList) {
                    let keys = infoList.querySelectorAll("dt");
                    let values = infoList.querySelectorAll("dd");
                    if (keys.length !== values.length) {
                        throw "keys and values length differ!";
                    }
                    for (let i = 0; i < keys.length; i++) {
                        response[keys[i].innerText.trim()] = values[i].innerText.trim();
                    }
                }

                let isDescription = !!row.querySelector("p[itemprop='description']");
                if (isDescription) {
                    response.description = row.querySelectorAll("p")[1].innerText;
                }
            });

            // Pictures
            let pictureUrls = [...document.querySelectorAll(".gallery img")].map(img => {
                return img.getAttribute("data-lazy") || img.src;
            }).filter(pictureUrl => {
                return pictureUrl.indexOf("AbstractDefaultAjaxBehavior") === -1;
            });
            response.pictures = pictureUrls;

            // Price history
            let priceHistory = document.querySelector("#stats");
            if (priceHistory) {
                response.priceHistory = [...priceHistory.querySelectorAll("li")].map(li => {
                    return {
                        date: li.querySelector("span").innerText.trim(),
                        price: li.querySelector("strong").innerText.trim()
                    };
                });
            }

            return response;
        });
    }).delay(3000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    });
};

// ---------

module.exports = EnBuenosAiresBrowser;

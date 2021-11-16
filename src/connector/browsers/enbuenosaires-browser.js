'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('EnBuenosAiresBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.enbuenosaires\.com\/venta\/.*-(\d+).html$/;

class EnBuenosAiresBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "2";

            let titleEl = document.querySelector(".container h1:not(#main_header)");

            if (!titleEl) {
                // No data was found (probably got redirected and the house no longer exists?)
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                };
            }

            let title = titleEl.innerText.trim();
            if (title === "Error del Sitio :-(") throw new Error("Site error!");

            // Description & features
            let description = "";
            let features = {};
            [...document.querySelectorAll(".clearfloats .row")].forEach(row => {
                let infoList = row.querySelector(".info_list");
                if (infoList) {
                    let keys = infoList.querySelectorAll("dt");
                    let values = infoList.querySelectorAll("dd");
                    if (keys.length !== values.length) {
                        throw new Error("keys and values length differ!");
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
            delete features["Última Act."];

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
    }
}


// ---------

module.exports = EnBuenosAiresBrowser;

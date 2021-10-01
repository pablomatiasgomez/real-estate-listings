'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('MenendezPropBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.menendezprop\.com\.ar\/Ficha\.aspx\?fichanro=(\d+).*$/;

class MenendezPropBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let EXPORT_VERSION = "1";

            let titleH2 = document.querySelector(".fichatitu h2");
            if (titleH2 && titleH2.innerText === "") {
                return {
                    EXPORT_VERSION: EXPORT_VERSION,
                    status: "OFFLINE",
                };
            }

            let basicData = {};
            [...document.querySelectorAll(".colLEFT"), ...document.querySelectorAll(".colRIGHT")].forEach(col => {
                let splits = col.innerText.split("\n");
                for (let i = 0; i < splits.length; i += 2) {
                    let key = splits[i].trim();
                    let value = splits[i + 1].trim();
                    if (key[key.length - 1] !== ":") throw new Error("Key doesn't have semicolon.");

                    key = key.replace(":", "");
                    basicData[key] = value;
                }
            });

            let features = {};
            [...document.querySelectorAll(".ficha_contenido")].forEach(content => {
                let keys = content.querySelectorAll(".data");
                let values = content.querySelectorAll(".data2");
                [...keys].forEach((key, i) => {
                    features[key.innerText.trim()] = values[i].innerText.trim() || true;
                });
            });

            let description = document.querySelector(".importantINFO").innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);

            return {
                EXPORT_VERSION: EXPORT_VERSION,
                basicData: basicData,
                features: features,
                description: description,
            };
        });
    }
}


// ---------

module.exports = MenendezPropBrowser;

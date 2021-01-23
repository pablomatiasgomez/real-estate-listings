'use strict';

const logger = include('utils/logger').newLogger('MenendezPropBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.menendezprop\.com\.ar\/Ficha\.aspx\?fichanro=(\d+).*$/;

function MenendezPropBrowser() {
}

MenendezPropBrowser.prototype.name = function () {
    return "MenendezProp";
};

MenendezPropBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MenendezPropBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

MenendezPropBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let basicData = {};
        [...document.querySelectorAll(".colLEFT"), ...document.querySelectorAll(".colRIGHT")].forEach(col => {
            let splits = col.innerText.split("\n");
            for (let i = 0; i < splits.length; i += 2) {
                let key = splits[i].trim();
                let value = splits[i + 1].trim();
                if (key[key.length - 1] !== ":") throw "Key doesn't have semicolon.";

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

        let description = document.querySelector(".importantINFO").innerText.trim();

        return {
            EXPORT_VERSION: "0",
            basicData: basicData,
            features: features,
            description: description,
        };
    });
};

// ---------

module.exports = MenendezPropBrowser;

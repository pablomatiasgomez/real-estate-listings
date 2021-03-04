'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('MenendezPropListingsBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www\.menendezprop\.com\.ar\/resultado\.aspx\?(.*)$/;

function MenendezPropListingsBrowser() {
}

MenendezPropListingsBrowser.prototype.name = function () {
    return "MenendezPropListings";
};

MenendezPropListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MenendezPropListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

MenendezPropListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

MenendezPropListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".resultado_datos")].forEach(itemData => {
            let item = itemData.parentNode;
            let id = item.querySelector(".resultado_iinfo").getAttribute("onclick").split("'")[1];

            let title = item.querySelector(".resultado_iinfo").innerText.trim();
            let price = item.querySelector(".resultados_precio").innerText.trim();
            let pictureUrl = item.querySelector(".resultado_imagen img").src;

            let description = null;
            let features = {};
            [...item.querySelectorAll(".resultado_datos div")].forEach(descriptionEl => {
                if (descriptionEl.className === "sub_resultado_datos") {
                    description = descriptionEl.innerText.trim();
                } else if (descriptionEl.className.startsWith("sub_resultado_datos")) {
                    descriptionEl.innerText.split("\n").forEach(feature => {
                        let split = feature.split(":");
                        features[split[0].trim()] = split[1].trim();
                    });
                }
            });

            response[id] = {
                title: title,
                price: price,
                pictureUrl: pictureUrl,
                description: description,
                features: features,
            };
        });

        response.pages = [...document.querySelector(".pagination").children]
            .filter(el => el.offsetParent !== null) // Not hidden
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        if (!response.pages.length) response.pages = [1];

        return response;
    });
};

MenendezPropListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    // TODO pagination not supported for MenendezProp, as it is handled via ajax
    throw "Not supported yet!";
};

// ---------

module.exports = MenendezPropListingsBrowser;

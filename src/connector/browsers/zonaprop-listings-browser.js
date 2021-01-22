'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('ZonaPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/([\w-]*[a-zA-Z]).html$/;

function ZonaPropListingsBrowser() {
}

ZonaPropListingsBrowser.prototype.useStealthBrowser = function () {
    return true;
};

ZonaPropListingsBrowser.prototype.withJavascriptDisabled = function () {
    return true;
};

ZonaPropListingsBrowser.prototype.name = function () {
    return "ZonaPropListings";
};

ZonaPropListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ZonaPropListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ZonaPropListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

ZonaPropListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // Grab postingInfo because JS is disabled.
        eval([...document.scripts]
            .map(script => script.innerHTML)
            .filter(script => script.indexOf("postingInfo") !== -1)
            [0]
            .replace("let postingInfo = {", "var customPostingInfo = {"));

        // noinspection JSUnresolvedVariable,JSHint
        Object.entries(customPostingInfo).forEach(entry => {
            let id = entry[0];
            let item = entry[1];

            let url = document.querySelector(`[data-id='${id}'] a.go-to-posting`).href.trim();
            let address = document.querySelector(`[data-id='${id}'] .postingCardLocationTitle`).innerText.trim();
            let location = document.querySelector(`[data-id='${id}'] .postingCardLocation`).innerText.trim();
            let features = {};
            [...document.querySelectorAll(`[data-id='${id}'] ul.postingCardMainFeatures li`)].forEach(li => {
                let key = li.querySelector("i").className.replace("postingCardIconsFeatures icon", "").trim();
                let value = li.innerText.trim();
                features[key] = value;
            });
            let title = document.querySelector(`[data-id='${id}'] .postingCardTitle`).innerText.trim();
            let description = document.querySelector(`[data-id='${id}'] .postingCardDescription`).innerText.trim();

            response[id] = {
                url: url,
                address: address,
                location: location,
                features: features,
                title: title,
                description: description,
            };
            Object.assign(response[id], JSON.parse(JSON.stringify(item)));
        });

        response.pages = [...document.querySelectorAll(".paging li:not(.pag-go-prev):not(.pag-go-next) a")]
            .map(a => parseInt(a.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

ZonaPropListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return `${listUrl.substring(0, listUrl.length - 5)}-pagina-${pageNumber}.html`;
};

// ---------

module.exports = ZonaPropListingsBrowser;

'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('ZonaPropListingsBrowser');

//---------------

// ZonaProp needs to have a sorting because otherwise the returned results are inconsistent across pages.
const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/([\w-]*orden[\w-]*[a-zA-Z]).html$/;

function ZonaPropListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(ZonaPropListingsBrowser, ListingsSiteBrowser);

ZonaPropListingsBrowser.prototype.useStealthBrowser = function () {
    return true;
};

ZonaPropListingsBrowser.prototype.withJavascriptEnabled = function () {
    return false;
};

ZonaPropListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // Grab postingInfo because JS is disabled.
        eval([...document.scripts] // jshint ignore:line
            .map(script => script.innerHTML)
            .filter(script => script.indexOf("postingInfo") !== -1)
            [0]
            .replace("let postingInfo = {", "var customPostingInfo = {"));

        Object.entries(customPostingInfo).forEach(entry => { // jshint ignore:line
            let id = entry[0];
            let item = entry[1];

            let url = document.querySelector(`[data-id='${id}'] a.go-to-posting`).href.trim();
            let address = document.querySelector(`[data-id='${id}'] .postingCardLocationTitle`).innerText.trim();
            let location = document.querySelector(`[data-id='${id}'] .postingCardLocation`).innerText.trim();
            let features = {};
            [...document.querySelectorAll(`[data-id='${id}'] ul.postingCardMainFeatures li`)].forEach(li => {
                let key = li.querySelector("i").className.replace("postingCardIconsFeatures icon", "").trim();
                features[key] = li.innerText.trim();
            });
            let title = document.querySelector(`[data-id='${id}'] .postingCardTitle`).innerText.trim();
            let description = document.querySelector(`[data-id='${id}'] .postingCardDescription`).innerText.split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);

            response[id] = {
                url: url,
                address: address,
                location: location,
                features: features,
                title: title,
                description: description,
            };
            Object.assign(response[id], item);
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

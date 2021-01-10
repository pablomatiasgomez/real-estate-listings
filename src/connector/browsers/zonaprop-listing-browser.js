'use strict';

const logger = include('utils/logger').newLogger('ZonaPropListingBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/propiedades\/.*-(\d+).html$/;

function ZonaPropListingBrowser() {
}

ZonaPropListingBrowser.prototype.useStealthBrowser = function () {
    return true;
};

ZonaPropListingBrowser.prototype.withJavascriptDisabled = function () {
    return true;
};

ZonaPropListingBrowser.prototype.name = function () {
    return "ZonaPropListing";
};

ZonaPropListingBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ZonaPropListingBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ZonaPropListingBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // Grab avisoInfo because JS is disabled.
        eval([...document.scripts]
            .map(script => script.innerHTML)
            .filter(script => script.indexOf("avisoInfo") !== -1)
            [0]
            .replace("const avisoInfo = {", "var customAvisoInfo = {"));

        // noinspection JSUnresolvedVariable,JSHint
        Object.assign(response, JSON.parse(JSON.stringify(customAvisoInfo)));
        // noinspection JSUnresolvedVariable
        delete response.similarPostingsLink;
        // noinspection JSUnresolvedVariable
        delete response.similarPostingsLinkDescription;

        return response;
    });
};

// ---------

module.exports = ZonaPropListingBrowser;

'use strict';

const logger = include('utils/logger').newLogger('ZonaPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/propiedades\/.*-(\d+).html$/;

function ZonaPropBrowser() {
}

ZonaPropBrowser.prototype.useStealthBrowser = function () {
    return true;
};

ZonaPropBrowser.prototype.withJavascriptDisabled = function () {
    return true;
};

ZonaPropBrowser.prototype.name = function () {
    return "ZonaProp";
};

ZonaPropBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ZonaPropBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ZonaPropBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // Grab and eval avisoInfo because JS is disabled.
        eval([...document.scripts] // jshint ignore:line
            .map(script => script.innerHTML)
            .filter(script => script.indexOf("avisoInfo") !== -1)
            [0]
            .replace("const avisoInfo = {", "var customAvisoInfo = {"));

        // noinspection JSUnresolvedVariable
        Object.assign(response, customAvisoInfo); // jshint ignore:line
        // noinspection JSUnresolvedVariable
        delete response.similarPostingsLink;
        // noinspection JSUnresolvedVariable
        delete response.similarPostingsLinkDescription;
        // noinspection JSUnresolvedVariable
        delete response.similarLink;

        return response;
    });
};

// ---------

module.exports = ZonaPropBrowser;

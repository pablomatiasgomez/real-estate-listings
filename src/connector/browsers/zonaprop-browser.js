'use strict';

const logger = include('utils/logger').newLogger('ZonaPropBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.zonaprop.com.ar\/.*-(\d+).html$/;

function ZonaPropBrowser() {
}

ZonaPropBrowser.prototype.useStealthBrowser = function () {
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

        // noinspection JSUnresolvedVariable,JSHint
        Object.assign(response, JSON.parse(JSON.stringify(avisoInfo)));
        // noinspection JSUnresolvedVariable
        delete response.similarPostingsLink;
        // noinspection JSUnresolvedVariable
        delete response.similarPostingsLinkDescription;

        return response;
    });
};

// ---------

module.exports = ZonaPropBrowser;

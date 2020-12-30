'use strict';

const logger = include('utils/logger').newLogger('ZonaPropBrowser');

//---------------

const LISTING_URL_REGEX = /^https?:\/\/www.zonaprop.com.ar\/propiedades\/.*-(\d+).html$/;
const LISTINGS_URL_REGEX = /^https?:\/\/www.zonaprop.com.ar\/([\w-]*-orden-[\w-]*).html$/;

function ZonaPropBrowser() {
    this.extractDataFns = [
        {
            regex: LISTING_URL_REGEX,
            fn: this.extractListingData,
        },
        {
            regex: LISTINGS_URL_REGEX,
            fn: this.extractListData,
        },
    ];
}

ZonaPropBrowser.prototype.useStealthBrowser = function () {
    return true;
};

ZonaPropBrowser.prototype.name = function () {
    return "ZonaProp";
};

ZonaPropBrowser.prototype.acceptsUrl = function (url) {
    return this.extractDataFns.some(entry => entry.regex.test(url));
};

ZonaPropBrowser.prototype.getId = function (url) {
    return this.extractDataFns
        .map(entry => entry.regex.exec(url))
        .filter(match => match && match.length === 2)
        .map(match => match[1])
        [0];
};

ZonaPropBrowser.prototype.extractData = function (browserPage) {
    let self = this;

    return self.extractDataFns
        .filter(entry => entry.regex.test(browserPage.url()))
        .map(entry => entry.fn.call(self, browserPage))
        [0];
};

ZonaPropBrowser.prototype.extractListingData = function (browserPage) {
    logger.info(`Extracting listing data...`);

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

ZonaPropBrowser.prototype.extractListData = function (browserPage) {
    logger.info(`Extracting list data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        // noinspection JSUnresolvedVariable,JSHint
        Object.assign(response, JSON.parse(JSON.stringify(postingInfo)));

        return response;
    });
};


// ---------

module.exports = ZonaPropBrowser;

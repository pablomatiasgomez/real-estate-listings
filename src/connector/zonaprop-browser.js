'use strict';

const logger = include('utils/logger').newLogger('ZonaPropBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.zonaprop.com.ar\/.*-(\d+).html$/;

function ZonaPropBrowser() {
}

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

ZonaPropBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url);
    }).then(() => {
        return browserPage.evaluate(() => {
            // noinspection JSUnresolvedVariable
            return avisoInfo; // jshint ignore:line
        });
    }).delay(1000).then(data => {
        logger.info(`Data fetched from url ${url}:`, JSON.stringify(data));
        return data;
    }).delay(1000);
};

// ---------

module.exports = ZonaPropBrowser;

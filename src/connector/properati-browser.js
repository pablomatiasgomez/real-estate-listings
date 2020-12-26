'use strict';

const logger = include('utils/logger').newLogger('ProperatiBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.properati.com.ar\/detalle\/(.+?)_.*$/;

function ProperatiBrowser() {
}

ProperatiBrowser.prototype.name = function () {
    return "Properati";
};

ProperatiBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

ProperatiBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

ProperatiBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url);
    }).then(() => {
        return browserPage.evaluate(() => {
            // noinspection JSUnresolvedVariable
            return window.__NEXT_DATA__.props.pageProps.property;
        });
    }).delay(1000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    }).delay(1000);
};

// ---------

module.exports = ProperatiBrowser;

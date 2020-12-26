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

ProperatiBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        // noinspection JSUnresolvedVariable
        return window.__NEXT_DATA__.props.pageProps.property;
    });
};

// ---------

module.exports = ProperatiBrowser;

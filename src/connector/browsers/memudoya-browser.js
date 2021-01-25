'use strict';

const logger = include('utils/logger').newLogger('MeMudoYaBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.memudoya\.com\/propiedad\/[a-zA-Z-]+([\d-]+)$/;

function MeMudoYaBrowser() {
}

MeMudoYaBrowser.prototype.name = function () {
    return "MeMudoYa";
};

MeMudoYaBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MeMudoYaBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

MeMudoYaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let title = window.title;
        let address = window.propAddress;
        let operation = window.operation;
        let location = {
            latitude: window.PAGE.latitude,
            longitude: window.PAGE.longitude,
        };
        let description = document.querySelector("meta[property='og:description']").getAttribute('content');
        let price = document.querySelector("p.lead").innerText.split("|")[1].trim();

        return {
            EXPORT_VERSION: "0",
            title: title,
            address: address,
            operation: operation,
            location: location,
            description: description,
            price: price,
        };
    });
};

// ---------

module.exports = MeMudoYaBrowser;

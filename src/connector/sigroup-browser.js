'use strict';

const logger = include('utils/logger').newLogger('SiGroupBrowser');

//---------------

const URL_REGEX = /^https?:\/\/www.sigroupinmobiliaria.com\/(.+)$/;

function SiGroupBrowser() {
}

SiGroupBrowser.prototype.name = function () {
    return "SiGroup";
};

SiGroupBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

SiGroupBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

SiGroupBrowser.prototype.fetchData = function (browserPage, url) {
    logger.info(`Getting url ${url} ..`);

    return Promise.resolve().then(() => {
        return browserPage.goto(url);
    }).then(() => {
        return browserPage.evaluate(() => {
            let response = {};

            // Many details as plain text..
            let textDetails = [...document.querySelectorAll("#SITE_PAGES [data-testid='richTextElement']")]
                .map(i => i.innerText);
            response.textDetails = textDetails;

            // Price
            let price = [...document.querySelectorAll("[data-testid='linkElement']")]
                .map(el => el.innerText)
                .filter(text => text.indexOf("$") !== -1)[0];
            response.price = price;

            // Pictures
            let pictureUrls = [...document.querySelectorAll("div[aria-label='Matrix gallery'] img")]
                .map(img => img.src);
            response.pictures = pictureUrls;

            return response;
        });
    }).delay(1000).then(data => {
        logger.info(`Data fetched from url ${url}: `, JSON.stringify(data).length);
        return data;
    }).delay(1000);
};

// ---------

module.exports = SiGroupBrowser;

'use strict';

const logger = include('utils/logger').newLogger('SiGroupBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.sigroupinmobiliaria\.com\/(.+)$/;

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

SiGroupBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let EXPORT_VERSION = "0";

        let price = [...document.querySelectorAll("[data-testid='linkElement']")]
            .map(el => el.innerText)
            .filter(text => text.indexOf("$") !== -1)[0];

        // Consider the page broken as it may happen that it does not load sometimes..
        if (!price) throw "Couldn't find price!";

        // Many details as plain text..
        let textDetails = [...document.querySelectorAll("#SITE_PAGES [data-testid='richTextElement']")].map(i => i.innerText);

        // TODO Pictures currently not working becasue JS is disabled. But it was flaky (because they are loaded via js..)
        let pictureUrls = [...document.querySelectorAll("div[aria-label='Matrix gallery'] img")].map(img => img.src);

        return {
            EXPORT_VERSION: EXPORT_VERSION,
            price: price,
            textDetails: textDetails,
            pictures: pictureUrls,
        };
    });
};

// ---------

module.exports = SiGroupBrowser;

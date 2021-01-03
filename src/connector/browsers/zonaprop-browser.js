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
    let self = this;
    logger.info(`Extracting list data...`);

    let listUrl = browserPage.url();
    let response = {
        EXPORT_VERSION: "0"
    };

    return self.extractListPage(response, browserPage).then(pageResponse => {
        logger.info(`Assigning ${Object.keys(pageResponse.length)} items...`);
        Object.assign(response, pageResponse);
        return pageResponse.pages;
    }).then(pages => {
        logger.info(`Pages are: ${pages}. We still need to process: ${pages.slice(1)}`);

        let promise = Promise.resolve();
        pages.slice(1).forEach(pageNumber => {
            promise = promise.then(() => {
                let pageUrl = self.getListPageUrl(listUrl, pageNumber);
                logger.info(`Processing page ${pageNumber}. Url: ${pageUrl}`);
                return browserPage.goto(pageUrl, {
                    waitUntil: 'load',
                    timeout: 60 * 1000,
                    referer: listUrl
                });
            }).then(response => {
                return self.extractListPage(response, browserPage);
            }).then(pageResponse => {
                logger.info(`Assigning ${Object.keys(pageResponse.length)} items...`);
                Object.assign(response, pageResponse);
            }).delay(20000);
        });
        return promise;
    });
};

ZonaPropBrowser.prototype.extractListPage = function (response, browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {};

        // noinspection JSUnresolvedVariable,JSHint
        Object.entries(postingInfo).forEach(entry => {
            let id = entry[0];
            let item = entry[1];

            let address = document.querySelector(`[data-id='${id}'] .postingCardLocationTitle`).innerText.trim();
            let location = document.querySelector(`[data-id='${id}'] .postingCardLocation`).innerText.trim();
            let features = {};
            [...document.querySelectorAll(`[data-id='${id}'] ul.postingCardMainFeatures li`)].forEach(li => {
                let key = li.querySelector("i").className.replace("postingCardIconsFeatures icon", "").trim();
                let value = li.innerText.trim();
                features[key] = value;
            });
            let title = document.querySelector(`[data-id='${id}'] .postingCardTitle`).innerText.trim();
            let description = document.querySelector(`[data-id='${id}'] .postingCardDescription`).innerText.trim();
            let url = document.querySelector(`[data-id='${id}'] a.go-to-posting`).href.trim();

            response[id] = {
                address: address,
                location: location,
                features: features,
                title: title,
                description: description,
                url: url,
            };
            Object.assign(response[id], JSON.parse(JSON.stringify(item)));

            response.pages = [...document.querySelectorAll(".paging li:not(.pag-go-prev):not(.pag-go-next) a")]
                .map(a => parseInt(a.innerText))
                .filter(page => !isNaN(page));
        });
        return response;
    });
};

ZonaPropBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return listUrl.substring(0, listUrl.length - 5) + `-pagina-${pageNumber}.html`;
};

// ---------

module.exports = ZonaPropBrowser;

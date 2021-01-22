'use strict';

const BrowserUtils = include('connector/browsers/browser-utils');

const logger = include('utils/logger').newLogger('EnBuenosAiresListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.enbuenosaires\.com\/\w+-ventas\.html#(.*)$/;

function EnBuenosAiresListingsBrowser() {
}

EnBuenosAiresListingsBrowser.prototype.name = function () {
    return "EnBuenosAiresListings";
};

EnBuenosAiresListingsBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

EnBuenosAiresListingsBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

EnBuenosAiresListingsBrowser.prototype.extractData = function (browserPage) {
    let self = this;
    return BrowserUtils.extractListingsPages(browserPage, self);
};

EnBuenosAiresListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "0"
        };

        [...document.querySelectorAll(".snapproperty")].forEach(item => {
            let url = item.querySelector(".viewadvertlink").href;
            let urlSplit = url.split("-");
            let id = urlSplit[urlSplit.length - 1].slice(0, -5);

            let title = item.querySelector(".titleproperty").innerText.trim();
            let subtitle = item.querySelector(".descriptionproperty strong").innerText.trim();
            let description = item.querySelector(".descriptionproperty p").innerText.trim();
            let seller = item.querySelector(".bottomproperty strong").innerText.trim();
            let pictureUrls = [...document.querySelectorAll(".snapproperty")[0].querySelectorAll(".gallery li img")].map(img => {
                return img.getAttribute("data-src") || img.src;
            }).filter(pictureUrl => {
                return pictureUrl.indexOf("loading") === -1;
            });

            response[id] = {
                url: url,
                title: title,
                subtitle: subtitle,
                description: description,
                seller: seller,
                pictureUrls: pictureUrls,
            };
        });

        response.pages = [...document.querySelectorAll(".pagination li")]
            .map(el => parseInt(el.innerText))
            .filter(page => !isNaN(page));
        return response;
    });
};

EnBuenosAiresListingsBrowser.prototype.getListPageUrl = function (listUrl, pageNumber) {
    return listUrl.replace("current_page=0", "current_page=" + (pageNumber - 1));
};

// ---------

module.exports = EnBuenosAiresListingsBrowser;

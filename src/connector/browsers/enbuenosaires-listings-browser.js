'use strict';

const util = require('util');
const ListingsSiteBrowser = include('connector/listings-site-browser');

const logger = include('utils/logger').newLogger('EnBuenosAiresListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.enbuenosaires\.com\/\w+-ventas\.html#(.*)$/;

/**
 * @constructor
 */
function EnBuenosAiresListingsBrowser() {
    ListingsSiteBrowser.call(this, URL_REGEX);
}

util.inherits(EnBuenosAiresListingsBrowser, ListingsSiteBrowser);

EnBuenosAiresListingsBrowser.prototype.extractListPage = function (browserPage) {
    logger.info(`Extracting list data for ${browserPage.url()}...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "2"
        };

        [...document.querySelectorAll(".snapproperty")].forEach(item => {
            let url = item.querySelector(".viewadvertlink").href;
            let urlSplit = url.split("-");
            let id = urlSplit[urlSplit.length - 1].slice(0, -5);

            let address = item.querySelector(".titleproperty").innerText.trim();
            let subtitle = item.querySelector(".descriptionproperty strong").innerText.trim();
            let features = item.querySelector(".descriptionproperty p").innerText.split(",").map(i => i.trim()).sort();
            let description = item.querySelector(".descriptionproperty p:nth-child(3)").innerText.split(" [# ")[0].split(/(?:\n|\. )+/).map(l => l.trim()).filter(l => !!l);
            let seller = item.querySelector(".bottomproperty strong").innerText.trim();
            let pictureUrls = [...item.querySelectorAll(".gallery li img")].map(img => {
                return img.getAttribute("data-src") || img.src;
            }).filter(pictureUrl => {
                return pictureUrl.indexOf("loading") === -1;
            });

            response[id] = {
                url: url,
                address: address,
                subtitle: subtitle,
                features: features,
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

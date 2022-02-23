'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('EnBuenosAiresListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.enbuenosaires\.com\/\w+-ventas\.html#(.*)$/;

class EnBuenosAiresListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "2"
            };

            let items = document.querySelectorAll(".snapproperty");
            if (items.length === 0) {
                throw new Error("No items were found, probably the page didn't load correctly.");
            }

            [...items].forEach(item => {
                let listingLink = item.querySelector(".viewadvertlink");
                // sometimes the "viewadvertlink" is not shown, so we try to grab the link from the left buttons.
                if (!listingLink) listingLink = item.querySelector(".pseudolink a");
                let url = listingLink.href.split("?")[0];

                let urlSplit = url.split("-");
                let id = urlSplit[urlSplit.length - 1].slice(0, -5);

                let status = item.querySelector(".corner-ribbon")?.innerText.trim();
                //let status = statusEl ? statusEl.innerText.trim() : undefined;
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
                    status: status,
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
    }

    getListPageUrl(listUrl, pageNumber) {
        return listUrl.replace("current_page=0", "current_page=" + (pageNumber - 1));
    }
}


// ---------

module.exports = EnBuenosAiresListingsBrowser;

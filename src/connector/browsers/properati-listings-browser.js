'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('ProperatiListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.properati\.com\.ar\/s\/(.+)$/;

class ProperatiListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "13"
            };

            [...document.querySelectorAll("#listings-content .snippet")].forEach(item => {
                let url = item.getAttribute("data-url");
                let id = url.split("/")[4];

                let title = item.querySelector(".title").innerText.trim();
                let price = item.querySelector(".price").innerText.trim();
                let location = item.querySelector(".location").innerText.trim();
                let seller = item.querySelector(".agency__name").innerText.trim();
                let features = [...item.querySelectorAll(".properties span")].map(i => i.innerText.trim());

                response[id] = {
                    url: url,
                    title: title,
                    price: price,
                    location: location,
                    seller: seller,
                    features: features,
                };
            });

            let pageCount = document.querySelector(".pagination__summary")?.innerText.split(" de ")[0].split("/")[1] || 1;
            response.pages = window.BrowserUtils.pageCountToPagesArray(pageCount);

            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        if (listUrl.includes("page=")) throw new Error("listUrl already contains pagination!");
        let appendChar = listUrl.includes("?") ? "&" : "?";
        return `${listUrl}${appendChar}page=${pageNumber}`;
    }
}


// ---------

module.exports = ProperatiListingsBrowser;

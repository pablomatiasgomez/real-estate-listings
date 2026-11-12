'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('CabaPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/propiedades\?(.+)$/;

class CabaPropListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}`);

        // The listings are fetched and rendered client side, wait until the loading placeholders are gone.
        return browserPage.waitForFunction(() => {
            return !document.querySelector("main .animate-pulse") &&
                ![...document.querySelectorAll("main p")].some(p => p.innerText.includes("Buscando"));
        }, {timeout: 60 * 1000}).then(() => browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "2"
            };

            let cleanText = text => text.replace(/\s+/g, " ").trim();

            [...document.querySelectorAll("main article")].forEach(item => {
                let titleLink = item.querySelector("h3").closest("a");
                let url = titleLink.href.split("?")[0];
                let id = url.split("/")[4];

                let title = cleanText(item.querySelector("h3").innerText);
                let location = cleanText(titleLink.nextElementSibling.innerText);
                let operation = [...item.querySelectorAll(".top-3 span")].map(i => cleanText(i.innerText)).join(", ");
                let price = cleanText(item.querySelector("p.text-2xl").innerText);
                let date = [...item.querySelectorAll("p")]
                    .map(p => cleanText(p.innerText))
                    .find(text => text.startsWith("Publicado el"))
                    ?.replace("Publicado el", "").trim();
                let features = [...titleLink.nextElementSibling.nextElementSibling.querySelectorAll("span")]
                    .map(i => cleanText(i.innerText))
                    .filter(i => !!i);

                response[id] = {
                    url: url,
                    title: title,
                    operation: operation,
                    location: location,
                    price: price,
                    features: features,
                    date: date,
                };
            });

            // Pagination only shows the first, last and pages around the current one, so we take the max.
            let pageNumbers = [...document.querySelectorAll("main nav button")]
                .map(button => parseInt(button.innerText.trim()))
                .filter(pageNumber => !isNaN(pageNumber));
            let pageCount = pageNumbers.length ? Math.max(...pageNumbers) : 1;
            response.pages = window.BrowserUtils.pageCountToPagesArray(pageCount);

            return response;
        }));
    }

    getListPageUrl(listUrl, pageNumber) {
        let url = new URL(listUrl);
        url.searchParams.set("page", pageNumber);
        return url.toString();
    }
}


// ---------

module.exports = CabaPropListingsBrowser;

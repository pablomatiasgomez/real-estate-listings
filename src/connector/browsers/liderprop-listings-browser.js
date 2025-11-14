'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('LiderPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/liderprop\.com\/es-ar\/propiedades\/venta\/([\w\-\/]*)\?.*$/;

class LiderPropListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "0"
            };

            [...document.querySelectorAll(".items .property-list")].forEach(item => {
                if (item.classList.contains("priority-2")) {
                    let url = item.querySelector("a").href;
                    let id = url.split("/")[5];

                    let price = item.querySelector(".price").innerText.trim();

                    response[id] = {
                        // We could eventually add more stuff to these type of promoted listings..
                        url: url,
                        price: price,
                    };
                } else {
                    let id = item.querySelector(".property-id").innerText.trim().slice(1);
                    let url = item.querySelector("a").href;

                    let operation = item.querySelector("h1 span").innerText.split("|")[0].trim();
                    let type = item.querySelector("header h1 span").innerText.split("|")[1].trim();
                    let address = item.querySelector("header h1 a").innerText.trim();
                    let title = item.querySelector("header p").innerText.trim();
                    let price = item.querySelector(".price").innerText.trim();
                    let seller = item.querySelector(".agency img") ? item.querySelector(".agency img").getAttribute("alt") : item.querySelector(".agency").innerText.trim();
                    let features = [...item.querySelectorAll("ul li")].reduce((features, li) => {
                        let key = li.childNodes[0].nodeValue.trim();
                        features[key] = li.childNodes[1].innerText.trim();
                        return features;
                    }, {});
                    let picturesCount = parseInt(item.querySelector("figure .count")?.innerText) || 0;

                    response[id] = {
                        url: url,
                        operation: operation,
                        type: type,
                        address: address,
                        title: title,
                        price: price,
                        seller: seller,
                        features: features,
                        picturesCount: picturesCount,
                    };
                }
            });

            let pageCount = parseInt(document.querySelector(".pagination p strong:nth-child(2)").innerText);
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

module.exports = LiderPropListingsBrowser;

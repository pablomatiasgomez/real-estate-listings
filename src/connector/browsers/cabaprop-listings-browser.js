'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('CabaPropListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/cabaprop\.com\.ar\/propiedades\/(.+)\?.*$/;

class CabaPropListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "1"
            };

            [...document.querySelectorAll(".feat_property")].forEach(item => {
                item = item.parentNode;
                let url = item.querySelector(".gallery-slider  a").href;
                let id = url.split("/")[4];

                let title = item.querySelector(".details .tc_content h4").innerText.trim();
                let operation = item.querySelector(".img-thumb .tag2 li").innerText.trim();
                let typeAndLocation = item.querySelector(".details .tc_content p").innerText.split("\n");
                let type = typeAndLocation[0].trim();
                let location = typeAndLocation[1].trim();

                let price = [...item.querySelectorAll(".fp_footer .lc-price-normal, .fp_footer .lc-price-small")].map(i => i.innerText.trim());
                let features = [...item.querySelectorAll(".details .prop_details li")].map(i => i.innerText.trim());
                let date = item.querySelector(".fp_footer > li > span").innerText.trim();

                response[id] = {
                    url: url,
                    title: title,
                    operation: operation,
                    type: type,
                    location: location,
                    price: price,
                    features: features,
                    date: date,
                };
            });

            let pagesSelector = document.querySelectorAll(".pagination li");
            let pageCount = parseInt(pagesSelector[pagesSelector.length - 2].innerText.trim());

            response.pages = window.BrowserUtils.pageCountToPagesArray(pageCount);
            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return listUrl.replace("pagina=1", "pagina=" + pageNumber);
    }
}


// ---------

module.exports = CabaPropListingsBrowser;

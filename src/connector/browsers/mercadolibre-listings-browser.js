'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('MercadoLibreListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/inmuebles\.mercadolibre\.com\.ar\/([\w-\/]*?)(?:_NoIndex_True)?$/;

class MercadoLibreListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}`);

        return browserPage.evaluate(() => {
            if (window.location.pathname.startsWith("/gz/account-verification")) {
                throw new Error("MercadoLibre bot-blocked: redirected to /gz/account-verification");
            }

            let response = {
                EXPORT_VERSION: "1"
            };

            // Listings data lives in a JSON-LD <script> inside .ui-search. Sponsored items don't have offers.url and are excluded.
            let ldScript = document.querySelector(".ui-search script[type='application/ld+json']");
            if (!ldScript) throw new Error("Couldn't find JSON-LD script!");
            let ld = JSON.parse(ldScript.innerText);

            ld["@graph"].filter(entry => entry.offers && entry.offers.url).forEach(entry => {
                let idMatch = entry.offers.url.match(/MLA-(\d+)/);
                if (!idMatch) throw new Error(`Couldn't extract id from url: ${entry.offers.url}`);
                let id = idMatch[1];

                let item = Object.assign({}, entry);
                delete item["@type"];
                delete item["@context"];
                delete item.mainEntityOfPage;
                response[id] = item;
            });

            // Pagination lives in the global rendering context script. last_page is 0 when single-page.
            let ctxScript = document.querySelector("script#__NORDIC_RENDERING_CTX__");
            if (!ctxScript) throw new Error("Couldn't find rendering ctx script!");
            let lastPageMatch = ctxScript.innerText.match(/"last_page":(\d+)/);
            if (!lastPageMatch) throw new Error("Couldn't find last_page in rendering ctx!");
            let lastPage = parseInt(lastPageMatch[1]) || 1;
            response.pages = Array.from({length: lastPage}, (_, i) => i + 1);

            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        let from = 48 * (pageNumber - 1) + 1;
        let filter = `_Desde_${from}`;

        let insertIndex = listUrl.lastIndexOf("/") + 1;
        if (listUrl.substring(insertIndex, insertIndex + 7) === "_Desde_") {
            throw new Error("Original url already contained page filter!");
        }
        return listUrl.substring(0, insertIndex) + filter + listUrl.substring(insertIndex);
    }
}


// ---------

module.exports = MercadoLibreListingsBrowser;

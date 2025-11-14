'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');
const MeMudoYaBrowser = require('./memudoya-browser.js');

const logger = newLogger('MeMudoYaListingsBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.memudoya\.com\/buscar\/([\w-\/]+)\/origin_filter$/;

class MeMudoYaListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}`);

        return browserPage.evaluate((urlRegexSource, urlRegexFlags) => {
            const URL_REGEX = RegExp(urlRegexSource, urlRegexFlags);

            let response = {
                EXPORT_VERSION: "0"
            };

            [...document.querySelectorAll("#results .result")].forEach(item => {
                let url = item.querySelector("a.media-left").href;

                let match = URL_REGEX.exec(url);
                if (!match || match.length !== 2) throw new Error(`Url couldn't be parsed: ${url}`);
                let id = match[1];

                let price = item.querySelector(".media-heading strong").innerText.trim();
                let title = item.querySelector(".media-heading a").innerText.trim();
                let description = item.querySelector(".media-body > p").innerText.trim();

                response[id] = {
                    url: url,
                    price: price,
                    title: title,
                    description: description,
                };
            });

            let pagesSelector = document.querySelector("select[name=page]");
            response.pages = !pagesSelector ? [1] : [...document.querySelector("select[name=page]").options]
                .map(option => parseInt(option.value))
                .filter(page => !isNaN(page));

            return response;
        }, MeMudoYaBrowser.URL_REGEX.source, MeMudoYaBrowser.URL_REGEX.flags);
    }

    getListPageUrl(listUrl, pageNumber) {
        return listUrl.replace("pagina_1", "pagina_" + pageNumber);
    }
}


// ---------

module.exports = MeMudoYaListingsBrowser;

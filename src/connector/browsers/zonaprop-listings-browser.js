'use strict';

const ListingsSiteBrowser = require('../listings-site-browser.js');

const logger = newLogger('ZonaPropListingsBrowser');

//---------------

// ZonaProp needs to have a sorting because otherwise the returned results are inconsistent across pages.
const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/([\w-]*orden[\w-]*[a-zA-Z]).html$/;

class ZonaPropListingsBrowser extends ListingsSiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    useStealthBrowser() {
        return true;
    }

    withJavascriptEnabled() {
        return false;
    }

    extractListPage(browserPage) {
        logger.info(`Extracting list data for ${browserPage.url()}...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "5"
            };

            // Grab postingInfo because JS is disabled.
            eval([...document.scripts] // jshint ignore:line
                .map(script => script.innerHTML)
                .filter(script => script.indexOf("postingInfo") !== -1)
                [0]
                .replace("let postingInfo = {", "var customPostingInfo = {"));

            Object.entries(customPostingInfo).forEach(entry => { // jshint ignore:line
                let id = entry[0];
                let item = entry[1];

                delete item.publisher.url;
                delete item.publisher.urlLogo;
                delete item.partialPhone;
                delete item.whatsApp;

                delete item.generalFeatures;
                delete item.mainFeatures;
                delete item.visiblePictures;

                item.prices = item.priceOperationTypes.flatMap(op => {
                    return op.prices.map(price => {
                        return {
                            operation: op.operationType.name,
                            currency: price.currency,
                            amount: price.amount,
                        };
                    });
                });
                delete item.priceOperationTypes;

                let location = "";
                let loc = item.location;
                while (loc) {
                    location += loc.name + ", ";
                    loc = loc.parent;
                }
                item.location = location.slice(0, -2);

                item.realEstateType = item.realEstateType.name;

                if (item.geoLocation) {
                    // Reduce the super long number of chars that are inclued in lat and lng...
                    item.geoLocation.lat = item.geoLocation.lat.substring(0, 10);
                    item.geoLocation.lng = item.geoLocation.lng.substring(0, 10);
                }

                item.url = document.querySelector(`[data-id='${id}'] a.go-to-posting`).href.trim();
                item.address = document.querySelector(`[data-id='${id}'] .postingCardLocationTitle`).innerText.trim();
                item.features = [...document.querySelectorAll(`[data-id='${id}'] ul.postingCardMainFeatures li`)].reduce((features, li) => {
                    let key = li.querySelector("i").className.replace("postingCardIconsFeatures icon", "").trim();
                    features[key] = li.innerText.trim();
                    return features;
                }, {});
                item.title = document.querySelector(`[data-id='${id}'] .postingCardTitle`).innerText.trim();

                response[id] = item;
            });

            response.pages = [...document.querySelectorAll(".paging li:not(.pag-go-prev):not(.pag-go-next) a")]
                .map(a => parseInt(a.innerText))
                .filter(page => !isNaN(page));
            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return `${listUrl.substring(0, listUrl.length - 5)}-pagina-${pageNumber}.html`;
    }
}


// ---------

module.exports = ZonaPropListingsBrowser;

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
                EXPORT_VERSION: "7"
            };

            // Grab listings' info because JS is disabled.
            let evalWindow = {};
            // noinspection JSUnusedLocalSymbols
            (function (window) {
                eval(document.querySelector("#preloadedData").innerText); // jshint ignore:line
            })(evalWindow);

            evalWindow.__PRELOADED_STATE__.listStore.listPostings.forEach(listPosting => {
                let id = listPosting.postingId;
                let url = new URL(listPosting.url, location.origin).href;
                let type = listPosting.realEstateType.name;
                let title = listPosting.title;
                let reserved = listPosting.reserved;
                let status = listPosting.status;
                let address = listPosting.postingLocation.address?.name;

                let prices = listPosting.priceOperationTypes.flatMap(op => {
                    return op.prices.map(price => {
                        return {
                            operation: op.operationType.name,
                            currency: price.currency,
                            amount: price.amount,
                        };
                    });
                });
                let expenses = listPosting.expenses ? listPosting.expenses.currency + listPosting.expenses.amount : null;

                let features = Object.values(listPosting.mainFeatures).reduce((features, feature) => {
                    features[feature.label] = feature.value + (feature.measure || "");
                    return features;
                }, {});

                let seller = listPosting.publisher.name;

                response[id] = {
                    url: url,
                    type: type,
                    title: title,
                    reserved: reserved,
                    status: status,
                    address: address,
                    prices: prices,
                    expenses: expenses,
                    features: features,
                    seller: seller,
                };
            });

            response.pages = evalWindow.__PRELOADED_STATE__.listStore.paging.pages;
            return response;
        });
    }

    getListPageUrl(listUrl, pageNumber) {
        return `${listUrl.substring(0, listUrl.length - 5)}-pagina-${pageNumber}.html`;
    }
}


// ---------

module.exports = ZonaPropListingsBrowser;

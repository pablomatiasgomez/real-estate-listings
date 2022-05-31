'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('ZonaPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/propiedades\/.*-(\d+).html$/;

class ZonaPropBrowser extends SiteBrowser {

    constructor() {
        super(URL_REGEX);
    }

    useStealthBrowser() {
        return true;
    }

    withJavascriptEnabled() {
        return false;
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        return browserPage.evaluate(() => {
            let response = {
                EXPORT_VERSION: "5"
            };

            // Grab and eval avisoInfo because JS is disabled.
            eval([...document.scripts] // jshint ignore:line
                .map(script => script.innerHTML)
                .filter(script => script.indexOf("avisoInfo") !== -1)
                [0]
                .replace("const avisoInfo = {", "var customAvisoInfo = {"));

            Object.assign(response, customAvisoInfo); // jshint ignore:line
            delete response.similarPostingsLink;
            delete response.similarPostingsLinkDescription;
            delete response.similarLink;
            delete response.similarLinkMostVisit;
            delete response.urlBack;
            delete response.publisher.url;
            delete response.publisher.urlLogo;
            delete response.partialPhone;
            delete response.whatsApp;
            delete response.quintoAndar;
            delete response.quintoAndarUrl;

            response.description = response.description.split(/(?:<br>|\. )+/).map(l => l.trim()).filter(l => !!l);

            let location = "";
            let loc = response.location;
            while (loc) {
                location += loc.name + ", ";
                loc = loc.parent;
            }
            response.location = location.slice(0, -2);

            response.pictureUrls = (response.pictures || []).map(picture => {
                let url = picture.url1200x1200;
                if (!url) throw new Error("Couldn't find picture url!");
                return url;
            });
            delete response.pictures;

            return response;
        });
    }
}


// ---------

module.exports = ZonaPropBrowser;

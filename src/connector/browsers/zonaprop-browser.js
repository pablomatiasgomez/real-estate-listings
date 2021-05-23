'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('ZonaPropBrowser');

//---------------

const URL_REGEX = /^https:\/\/www\.zonaprop\.com\.ar\/propiedades\/.*-(\d+).html$/;

/**
 * @constructor
 */
function ZonaPropBrowser() {
    SiteBrowser.call(this, URL_REGEX);
}

util.inherits(ZonaPropBrowser, SiteBrowser);

ZonaPropBrowser.prototype.useStealthBrowser = function () {
    return true;
};

ZonaPropBrowser.prototype.withJavascriptEnabled = function () {
    return false;
};

ZonaPropBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "3"
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
        delete response.urlBack;
        delete response.publisher.url;
        delete response.publisher.urlLogo;

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
            if (!url) throw "Couldn't find picture url!";
            return url;
        });
        delete response.pictures;

        return response;
    });
};

// ---------

module.exports = ZonaPropBrowser;

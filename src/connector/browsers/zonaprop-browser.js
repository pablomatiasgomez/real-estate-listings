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

    useScrapeDo() {
        return true;
    }

    withJavascriptEnabled() {
        return false;
    }

    logHtmlOnError() {
        return true;
    }

    extractData(html) {
        logger.info(`Extracting data...`);

        return Promise.resolve().then(() => {
            let response = {
                EXPORT_VERSION: "6"
            };

            // This is pretty hacky and works just because ZonaProp has their <script> tags with new lines...
            // Eventually cheerio or jsdom could be used to parse the html properly.
            let lines = html.split("\n");
            let scripts = [];
            let script = "";
            let startedScript = false;
            for (let line of lines) {
                if (line.trim() === "<script>") {
                    if (startedScript) throw new Error(`Starting script when already started...`);
                    startedScript = true;
                } else if (startedScript && line.trim() === "</script>") {
                    startedScript = false;
                    scripts.push(script);
                    script = "";
                } else if (startedScript) {
                    script += line;
                    script += "\n";
                }
            }

            let customAvisoInfo;

            // Grab and eval avisoInfo because JS is disabled.
            eval(scripts // jshint ignore:line
                .filter(script => script.includes("avisoInfo"))
                [0]
                .replace("const avisoInfo = {", "customAvisoInfo = {"));

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
            delete response.premier;

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

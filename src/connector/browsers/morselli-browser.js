'use strict';

const XintelBrowser = require('./xintel-browser.js');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?morselli\.com\.ar\/propiedad\.php\?reference_code=MII(\d+).*$/i;

class MorselliBrowser extends XintelBrowser {

    getXintelId(url) {
        let splits = url.split("=");
        return splits[splits.length - 1];
    }

    constructor() {
        super(URL_REGEX);
    }
}


// ---------

module.exports = MorselliBrowser;

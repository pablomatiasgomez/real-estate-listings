'use strict';

const XintelBrowser = require('./xintel-browser.js');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?saadcenturion\.com\.ar\/.*SAA(\d+).*$/i;

class SaadCenturionBrowser extends XintelBrowser {

    constructor() {
        super(URL_REGEX);
    }
}


// ---------

module.exports = SaadCenturionBrowser;

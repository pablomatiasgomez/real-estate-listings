'use strict';

const XintelBrowser = require('./xintel-browser.js');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?maluma\.com\.ar\/.*MLM(\d+).*$/i;

class MalumaBrowser extends XintelBrowser {

    getXintelId(url) {
        let splits = url.split("-");
        return splits[splits.length - 1];
    }

    constructor() {
        super(URL_REGEX);
    }
}


// ---------

module.exports = MalumaBrowser;

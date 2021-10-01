'use strict';

const XintelBrowser = require('./xintel-browser.js');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?maluma\.com\.ar\/.*MLM(\d+).*$/i;

class MalumaBrowser extends XintelBrowser {

    constructor() {
        super(URL_REGEX);
    }
}


// ---------

module.exports = MalumaBrowser;

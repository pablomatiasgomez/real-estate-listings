'use strict';

const util = require('util');

const XintelBrowser = include('connector/browsers/xintel-browser');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?saadcenturion\.com\.ar\/.*SAA(\d+).*$/i;

function SaadCenturionBrowser() {
    XintelBrowser.call(this, URL_REGEX);
}

util.inherits(SaadCenturionBrowser, XintelBrowser);

// ---------

module.exports = SaadCenturionBrowser;

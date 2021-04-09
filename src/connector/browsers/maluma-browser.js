'use strict';

const util = require('util');

const XintelBrowser = include('connector/browsers/xintel-browser');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?maluma\.com\.ar\/.*MLM(\d+).*$/i;

function MalumaBrowser() {
    XintelBrowser.call(this, URL_REGEX);
}

util.inherits(MalumaBrowser, XintelBrowser);

// ---------

module.exports = MalumaBrowser;

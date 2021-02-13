'use strict';

const util = require('util');

const XintelBrowser = include('connector/browsers/xintel-browser');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?saadcenturion\.com\.ar\/.*SAA(\d+).*$/i;

function SaadCenturionBrowser() {
}

util.inherits(SaadCenturionBrowser, XintelBrowser);

SaadCenturionBrowser.prototype.name = function () {
    return "SaadCenturion";
};

SaadCenturionBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

SaadCenturionBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

// ---------

module.exports = SaadCenturionBrowser;

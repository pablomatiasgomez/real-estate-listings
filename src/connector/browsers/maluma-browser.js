'use strict';

const util = require('util');

const XintelBrowser = include('connector/browsers/xintel-browser');

//---------------

const URL_REGEX = /^https?:\/\/(?:www\.)?maluma\.com\.ar\/.*MLM(\d+).*$/i;

function MalumaBrowser() {
}

util.inherits(MalumaBrowser, XintelBrowser);

MalumaBrowser.prototype.name = function () {
    return "Maluma";
};

MalumaBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

MalumaBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

// ---------

module.exports = MalumaBrowser;

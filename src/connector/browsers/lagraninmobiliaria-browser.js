'use strict';

const logger = include('utils/logger').newLogger('LaGranInmobiliariaBrowser');

//---------------

const URL_REGEX = /^https:\/\/lagraninmobiliaria\.com\/(\d+)-.*$/;

function LaGranInmobiliariaBrowser() {
}

LaGranInmobiliariaBrowser.prototype.name = function () {
    return "LaGranInmobiliaria";
};

LaGranInmobiliariaBrowser.prototype.acceptsUrl = function (url) {
    return URL_REGEX.test(url);
};

LaGranInmobiliariaBrowser.prototype.getId = function (url) {
    let match = URL_REGEX.exec(url);
    if (!match || match.length !== 2) throw "Url couldn't be parsed: " + url;
    return match[1];
};

LaGranInmobiliariaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {
            EXPORT_VERSION: "1"
        };

        let id = location.href.split("-")[0].split("/")[3];
        let data = JSON.parse(document.querySelector("#euclides-lgi-state").innerHTML.replace(/&q;/g, '"'));
        Object.assign(response, data[`G.https://api.lagraninmobiliaria.com/api/getlisting/id/${id}?`].body);

        return response;
    });
};

// ---------

module.exports = LaGranInmobiliariaBrowser;

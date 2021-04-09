'use strict';

const util = require('util');
const SiteBrowser = include('connector/site-browser');

const logger = include('utils/logger').newLogger('XintelBrowser');

//---------------

/**
 * Generic browser for sites that were implemented by Xintel
 */
function XintelBrowser(urlRegex) {
    SiteBrowser.call(this, urlRegex);
}

util.inherits(XintelBrowser, SiteBrowser);

XintelBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        return new Promise((resolve, reject) => {
            let response = {
                EXPORT_VERSION: "1"
            };

            let script = [...document.getElementsByTagName("script")]
                .filter(script => script.innerText.indexOf("fichas.propiedades") !== -1)
                [0]
                .innerText;

            let successFnStr = "success:function(response){";
            let startingFunctionIndex = script.indexOf(successFnStr);
            if (startingFunctionIndex === -1) throw "Couldn't find success fn!";
            script = script.substring(0, startingFunctionIndex + successFnStr.length);

            /**
             * Create global fns where we will be called.
             * @param {{ resultado: Object }} r - ajax response
             */
            window.customOnSuccessFn = function (r) {
                Object.assign(response, r.resultado);
                resolve(response);
            };
            window.customOnError = function (err) {
                reject(err);
            };

            //  success:function(response){
            script += `
                    window.customOnSuccessFn(response);
                },
                error: function(err) {
                    window.customOnError(err)
                }
            });`;

            eval(script); // jshint ignore:line
        });
    });
};

// ---------

module.exports = XintelBrowser;

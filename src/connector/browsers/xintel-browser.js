'use strict';

const SiteBrowser = require('../site-browser.js');

const logger = newLogger('XintelBrowser');

//---------------

/**
 * Generic browser for sites that were implemented by Xintel
 */
class XintelBrowser extends SiteBrowser {

    constructor(urlRegex) {
        super(urlRegex);
    }

    extractData(browserPage) {
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
                if (startingFunctionIndex === -1) throw new Error("Couldn't find success fn!");
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
    }
}


// ---------

module.exports = XintelBrowser;

'use strict';

const logger = include('utils/logger').newLogger('XintelBrowser');

//---------------

/**
 * Generic browser for sites that were implemented by Xintel
 */
function XintelBrowser() {
}

XintelBrowser.prototype.name = function () {
    throw "Method must be implemented!";
};

XintelBrowser.prototype.acceptsUrl = function (url) {
    throw "Method must be implemented!";
};

XintelBrowser.prototype.getId = function (url) {
    throw "Method must be implemented!";
};

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

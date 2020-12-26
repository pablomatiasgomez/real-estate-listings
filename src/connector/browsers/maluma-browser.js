'use strict';

const logger = include('utils/logger').newLogger('MalumaBrowser');

//---------------

const URL_REGEX = /^https?:\/\/(?:www.)?maluma.com.ar\/.*MLM(\d+).*$/i;

function MalumaBrowser() {
}

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

MalumaBrowser.prototype.extractData = function (browserPage) {
    logger.info(`Extracting data...`);

    return browserPage.evaluate(() => {
        let response = {};

        let script = [...document.getElementsByTagName("script")]
            .filter(script => script.innerText.indexOf("fichas.propiedades") !== -1)
            [0]
            .innerText;

        let successFnStr = "success:function(response){";

        let startingFunctionIndex = script.indexOf(successFnStr);
        if (startingFunctionIndex === -1) throw "Couldn't find success fn!";

        script = script.substring(0, startingFunctionIndex + successFnStr.length);

        // Create global fn where we will be called.
        window.customOnSuccessFn = function (r) {
            response = r;
        };

        script += "window.customOnSuccessFn(response); }, async:false });";

        eval(script); // jshint ignore:line
        return response;
    });
};

// ---------

module.exports = MalumaBrowser;
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

    /**
     * This method must be implemented and should extract the ID from the url
     * @param url current url
     */
    getXintelId(url) {
        throw new Error("Method must be implemented!");
    }

    extractData(browserPage) {
        logger.info(`Extracting data...`);

        let xintelId = this.getXintelId(browserPage.url());
        logger.info(`Using xintelId ${xintelId}...`);

        return browserPage.evaluate((xintelApiKey, xintelId) => {
            let response = {
                EXPORT_VERSION: "1"
            };

            let code = xintelId.substring(0, 3);
            let id = xintelId.substring(3);
            let apiURL = `https://xintelapi.com.ar/?cache=20092024&json=fichas.propiedades&amaira=false&suc=${code}&global=LU3AIKPR4F6ZSUY8GQODKWRO8&emprendimiento=True&oppel=&esweb=&apiK=${xintelApiKey}&id=${id}&_=${Date.now()}`;

            return fetch(apiURL).then(response => {
                if (!response.ok) throw new Error("Failed to fetch data" + response);
                return response.json();
            }).then(responseJson => {
                Object.assign(response, responseJson.resultado);
                return response;
            });
        }, config.browser.xintelApiKey, xintelId);
    }
}


// ---------

module.exports = XintelBrowser;

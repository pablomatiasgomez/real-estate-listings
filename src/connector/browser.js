'use strict';

const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const UserAgents = require('user-agents');

const ZonaPropBrowser = require('./browsers/zonaprop-browser.js');
const ZonaPropListingsBrowser = require('./browsers/zonaprop-listings-browser.js');
const ArgenPropBrowser = require('./browsers/argenprop-browser.js');
const ArgenPropListingsBrowser = require('./browsers/argenprop-listings-browser.js');
const MercadoLibreBrowser = require('./browsers/mercadolibre-browser.js');
const MercadoLibreListingsBrowser = require('./browsers/mercadolibre-listings-browser.js');
const ProperatiBrowser = require('./browsers/properati-browser.js');
const ProperatiListingsBrowser = require('./browsers/properati-listings-browser.js');
const EnBuenosAiresBrowser = require('./browsers/enbuenosaires-browser.js');
const EnBuenosAiresListingsBrowser = require('./browsers/enbuenosaires-listings-browser.js');
const RemaxBrowser = require('./browsers/remax-browser.js');
const RemaxListingsBrowser = require('./browsers/remax-listings-browser.js');
const LaGranInmobiliariaBrowser = require('./browsers/lagraninmobiliaria-browser.js');
const LaGranInmobiliariaListingsBrowser = require('./browsers/lagraninmobiliaria-listings-browser.js');
const MalumaBrowser = require('./browsers/maluma-browser.js');
const ICasasBrowser = require('./browsers/icasas-browser.js');
const ICasasListingsBrowser = require('./browsers/icasas-listings-browser.js');
const SiGroupBrowser = require('./browsers/sigroup-browser.js');
const CabaPropBrowser = require('./browsers/cabaprop-browser.js');
const CabaPropListingsBrowser = require('./browsers/cabaprop-listings-browser.js');
const VarcasiaBrowser = require('./browsers/varcasia-browser.js');
const MagnaccaBrowser = require('./browsers/magnacca-browser.js');
const MenendezPropBrowser = require('./browsers/menendezprop-browser.js');
const MenendezPropListingsBrowser = require('./browsers/menendezprop-listings-browser.js');
const MeMudoYaBrowser = require('./browsers/memudoya-browser.js');
const MeMudoYaListingsBrowser = require('./browsers/memudoya-listings-browser.js');
const LiderPropBrowser = require('./browsers/liderprop-browser.js');
const LiderPropListingsBrowser = require('./browsers/liderprop-listings-browser.js');
const GrupoMegaBrowser = require('./browsers/grupomega-browser.js');
const GrupoMegaListingsBrowser = require('./browsers/grupomega-listings-browser.js');
const MudafyListingsBrowser = require("./browsers/mudafy-listings-browser");

const Utils = require('../utils/utils.js');

const logger = newLogger('Browser');

//---------------

const DEBUG = false;

const SITE_BROWSERS = [
    new ZonaPropBrowser(),
    new ZonaPropListingsBrowser(),
    new ArgenPropBrowser(),
    new ArgenPropListingsBrowser(),
    new MercadoLibreBrowser(),
    new MercadoLibreListingsBrowser(),
    new ProperatiBrowser(),
    new ProperatiListingsBrowser(),
    new EnBuenosAiresBrowser(),
    new EnBuenosAiresListingsBrowser(),
    new RemaxBrowser(),
    new RemaxListingsBrowser(),
    new LaGranInmobiliariaBrowser(),
    new LaGranInmobiliariaListingsBrowser(),
    new MalumaBrowser(),
    new ICasasBrowser(),
    new ICasasListingsBrowser(),
    new SiGroupBrowser(),
    new CabaPropBrowser(),
    new CabaPropListingsBrowser(),
    new VarcasiaBrowser(),
    new MagnaccaBrowser(),
    new MenendezPropBrowser(),
    new MenendezPropListingsBrowser(),
    new MeMudoYaBrowser(),
    new MeMudoYaListingsBrowser(),
    new LiderPropBrowser(),
    new LiderPropListingsBrowser(),
    new GrupoMegaBrowser(),
    new GrupoMegaListingsBrowser(),
    new MudafyListingsBrowser(),
];

const BROWSER_KINDS = {
    "NORMAL": "NORMAL",
    "STEALTH": "STEALTH",
};
const MAX_RETRY_TIMES = 3;

class Browser {

    constructor() {
        puppeteerExtra.use(StealthPlugin());
        this.userAgents = new UserAgents();

        this.browserOptions = {
            headless: !DEBUG,
            devtools: DEBUG,
            targetFilter: (target) => {
                console.log(`calling target filter with type: ${target.type()} , url: ${target.url()} , returning ${target.type() !== 'other' || !!target.url()} `);
                return target.type() !== 'other' || !!target.url();
            },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',

                // These were added to run in WSL:
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-zygote',
                // '--single-process', // Temporarily disabled as it was not working on Mac M1.
            ],
        };
        this.currentBrowserKind = null;
        this.currentBrowser = null;
        this.currentBrowserPage = null;
    }

    fetchData(url, tryCount = 1) {
        let self = this;

        let siteBrowser = self.getSiteBrowserForUrl(url);
        if (!siteBrowser) {
            logger.info(`No site browser matches url ${url}`);
            return Promise.resolve(null);
        }

        return Promise.resolve().then(() => {
            let browserKind = siteBrowser.useStealthBrowser() ? BROWSER_KINDS.STEALTH : BROWSER_KINDS.NORMAL;
            logger.info(`Getting browser for url ${url} using ${siteBrowser.name()} with ${browserKind} browser, try ${tryCount}..`);
            return self.getBrowserPage(browserKind);
        }).then(page => {
            return Promise.resolve().then(() => {
                let javascriptEnabled = siteBrowser.withJavascriptEnabled();
                return page.setJavaScriptEnabled(javascriptEnabled);
            }).then(() => {
                // Randomize user agent
                return page.setUserAgent(self.userAgents.toString());
            }).then(() => {
                return siteBrowser.extractUrlData(page, url);
            }).then(data => {
                logger.info(`Data fetched from url ${url} : `, JSON.stringify(data).length);
                return {
                    id: self.getUrlIdWithSiteBrowser(url, siteBrowser),
                    url: url,
                    data: data
                };
            });
        }).catch(e => {
            /**
             * An error can be retried if it is a TimeoutError or a ProtocolError
             * - TimeoutError: when the page is not loaded in time or the element is not found
             * - ProtocolError: when the page is closed before the screenshot is taken
             * - That include the message "Target closed" or "Protocol error" - e.g: Protocol error (Page.captureScreenshot): Target closed or Protocol error (DOM.describeNode): Target closed"
             */
            const isRetryableError =
                e instanceof puppeteer.TimeoutError ||
                e instanceof puppeteer.ProtocolError ||
                e.message.includes('Protocol error') ||
                e.message.includes('Target closed');

            // Allow to retry by closing the browser and opening again.
            if (!isRetryableError || tryCount >= MAX_RETRY_TIMES) {
                logger.error(`Failed to fetch data for url ${url}, tried ${tryCount} times, isRetryableError: ${isRetryableError}, skipping...`, e);
                throw e;
            }
            logger.error(`Failed to fetch data for url ${url}, tried ${tryCount}, trying again...`, e);
            return self.closeCurrentBrowser().then(Utils.delay(1000)).then(() => {
                return self.fetchData(url, tryCount + 1);
            });
        });
    }

    /**
     * Public method exposed to retrieve the id without getting the url data
     * @param url
     * @returns {string|null}
     */
    getUrlId(url) {
        let self = this;
        let siteBrowser = self.getSiteBrowserForUrl(url);
        if (!siteBrowser) {
            logger.info(`No site browser matches url ${url}`);
            return null;
        }
        return self.getUrlIdWithSiteBrowser(url, siteBrowser);
    }

    getUrlIdWithSiteBrowser(url, siteBrowser) {
        return siteBrowser.name() + "-" + siteBrowser.getId(url);
    }

    getSiteBrowserForUrl(url) {
        let siteBrowsers = SITE_BROWSERS.filter(siteBrowser => siteBrowser.acceptsUrl(url));
        if (siteBrowsers.length > 1) {
            throw new Error(`More than one siteBrowsers match the same url: ${siteBrowsers.map(siteBrowser => siteBrowser.name())}`);
        }
        return siteBrowsers[0];
    }

    getBrowserPage(browserKind) {
        let self = this;
        if (browserKind === self.currentBrowserKind) {
            logger.info(`Reusing browser page for kind ${browserKind} ...`);
            return Promise.resolve(self.currentBrowserPage);
        }

        // There are 2 memory usage improvements being done here:
        // - Close the previous browser and open the new one in order to only have one open at a time.
        // - Always reuse the browser page. They could eventually be closed and opened a new one, but it seems that chrome has a memory leak if that is done.
        return self.closeCurrentBrowser().then(Utils.delay(1000)).then(() => {
            self.currentBrowserKind = browserKind;
            let launcher = browserKind === BROWSER_KINDS.NORMAL ? puppeteer : puppeteerExtra;
            logger.info(`Opening a new browser for kind ${browserKind} ...`);
            return launcher.launch(self.browserOptions);
        }).then(browser => {
            self.currentBrowser = browser;
            return self.currentBrowser.newPage();
        }).then(page => {
            self.currentBrowserPage = page;
            return self.currentBrowserPage;
        });
    }

    close() {
        let self = this;
        logger.info(`Shutting down connector ..`);
        return self.closeCurrentBrowser();
    }

    closeCurrentBrowser() {
        let self = this;
        logger.info(`Closing current ${self.currentBrowserKind} browser...`);

        let closeables = [
            self.currentBrowserPage,
            self.currentBrowser,
        ];
        let promise = Promise.resolve();
        closeables.filter(closeable => !!closeable).forEach(closeable => {
            promise = promise.then(() => closeable.close());
        });
        return promise.then(() => {
            this.currentBrowserKind = null;
            this.currentBrowser = null;
            this.currentBrowserPage = null;
        });
    }
}

// ---------

module.exports = Browser;

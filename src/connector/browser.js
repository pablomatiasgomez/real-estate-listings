'use strict';

const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

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
const MorselliBrowser = require("./browsers/morselli-browser");

const BotBlockedError = require('./bot-blocked-error.js');
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
    // Disabled: gives false-positive diffs. See src/connector/browsers/icasas-listings-browser.js for details.
    // new ICasasListingsBrowser(),
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
    new MorselliBrowser(),
];

const BROWSER_KINDS = {
    "NORMAL": "NORMAL",
    "STEALTH": "STEALTH",
};
const MAX_RETRY_TIMES = 3;
// Chrome's memory keeps growing while the same browser is reused, so it's restarted after this many fetches.
const MAX_FETCHES_PER_BROWSER = 20;

class Browser {

    constructor() {
        puppeteerExtra.use(StealthPlugin());

        this.browserOptions = {
            headless: !DEBUG,
            devtools: DEBUG,
            // Use the window size as viewport, instead of puppeteer's default 800x600 (together with --screen-info, so they match).
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',

                // Avoid an obvious automation fingerprint (e.g. navigator.webdriver = true, no WebGL, 800x600 screen).
                // Don't use --disable-gpu as it disables WebGL. Instead, allow the software WebGL fallback on hosts without GPU.
                '--disable-blink-features=AutomationControlled',
                '--enable-unsafe-swiftshader',
                '--window-size=1440,900',
                '--screen-info={1440x900}',

                // On Linux, avoid crashes when /dev/shm is small (e.g. in Docker), by using /tmp for shared memory instead.
                '--disable-dev-shm-usage',

                ...(config.browser.proxy ? ['--proxy-server=' + config.browser.proxy] : []),
            ],
        };
        this.currentBrowserKind = null;
        this.currentBrowser = null;
        this.currentBrowserPage = null;
        this.currentBrowserFetches = 0;
        this.userAgent = null;
    }

    fetchData(url, tryCount = 1) {
        let siteBrowser = this.getSiteBrowserForUrl(url);
        if (!siteBrowser) {
            logger.info(`No site browser matches url ${url}`);
            return Promise.resolve(null);
        }

        return Promise.resolve().then(() => {
            if (this.currentBrowserFetches >= MAX_FETCHES_PER_BROWSER) {
                logger.info(`Restarting browser after ${this.currentBrowserFetches} fetches...`);
                return this.closeCurrentBrowser().then(Utils.delay(1000));
            }
        }).then(() => {
            let browserKind = siteBrowser.useStealthBrowser() ? BROWSER_KINDS.STEALTH : BROWSER_KINDS.NORMAL;
            logger.info(`Getting browser for url ${url} using ${siteBrowser.name()} with ${browserKind} browser, try ${tryCount}..`);
            return this.getBrowserPage(browserKind);
        }).then(page => {
            this.currentBrowserFetches++;
            return Promise.resolve().then(() => {
                let javascriptEnabled = siteBrowser.withJavascriptEnabled();
                return page.setJavaScriptEnabled(javascriptEnabled);
            }).then(() => {
                return siteBrowser.extractUrlData(page, url);
            }).then(data => {
                logger.info(`Data fetched from url ${url} : `, JSON.stringify(data).length);
                return {
                    id: this.getUrlIdWithSiteBrowser(url, siteBrowser),
                    url: url,
                    name: siteBrowser.name(),
                    data: data
                };
            });
        }).catch(e => {
            /**
             * An error can be retried if it is a TimeoutError or a ProtocolError
             * - TimeoutError: when the page is not loaded in time or the element is not found
             * - ProtocolError: when the page is closed before the screenshot is taken
             * - That include the message "Target closed" or "Protocol error" - e.g: Protocol error (Page.captureScreenshot): Target closed or Protocol error (DOM.describeNode): Target closed"
             * - retryableHttpError: a transient server error (5xx) detected while loading the page (see SiteBrowser.loadUrl)
             */
            const isRetryableError =
                e instanceof puppeteer.TimeoutError ||
                e instanceof puppeteer.ProtocolError ||
                e.message.includes('Protocol error') ||
                e.message.includes('Target closed') ||
                e.retryableHttpError === true;

            // Allow to retry by closing the browser and opening again.
            if (!isRetryableError || tryCount >= MAX_RETRY_TIMES) {
                if (e instanceof BotBlockedError) {
                    logger.error(`Bot blocked fetching url ${url} (${e.blockReason}), tried ${tryCount} times, skipping...`);
                } else {
                    logger.error(`Failed to fetch data for url ${url}, tried ${tryCount} times, isRetryableError: ${isRetryableError}, skipping...`, e);
                }
                e.siteBrowserName = siteBrowser.name();
                throw e;
            }
            logger.warn(`Failed to fetch data for url ${url}, tried ${tryCount}, trying again...`, e);
            return this.closeCurrentBrowser().then(Utils.delay(1000)).then(() => {
                return this.fetchData(url, tryCount + 1);
            });
        });
    }

    /**
     * Public method exposed to retrieve the id without getting the url data
     * @param url
     * @returns {string|null}
     */
    getUrlId(url) {
        let siteBrowser = this.getSiteBrowserForUrl(url);
        if (!siteBrowser) {
            logger.info(`No site browser matches url ${url}`);
            return null;
        }
        return this.getUrlIdWithSiteBrowser(url, siteBrowser);
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
        if (browserKind === this.currentBrowserKind) {
            logger.info(`Reusing browser page for kind ${browserKind} ...`);
            return Promise.resolve(this.currentBrowserPage);
        }

        // There are 2 memory usage improvements being done here:
        // - Close the previous browser and open the new one in order to only have one open at a time.
        // - Always reuse the browser page. They could eventually be closed and opened a new one, but it seems that chrome has a memory leak if that is done.
        return this.closeCurrentBrowser().then(Utils.delay(1000)).then(() => {
            return this.getUserAgent();
        }).then(userAgent => {
            let launcher = browserKind === BROWSER_KINDS.NORMAL ? puppeteer : puppeteerExtra;
            logger.info(`Opening a new browser for kind ${browserKind} ...`);
            let options = Object.assign({}, this.browserOptions, {args: [...this.browserOptions.args, `--user-agent=${userAgent}`]});
            return launcher.launch(options);
        }).then(browser => {
            this.currentBrowser = browser;
            return this.currentBrowser.newPage();
        }).then(page => {
            this.currentBrowserKind = browserKind;
            this.currentBrowserPage = page;
            return this.currentBrowserPage;
        });
    }

    /**
     * Returns the user agent of the Chrome being used, without the "HeadlessChrome" marker. It is passed to Chrome as a
     * launch flag (and not with page.setUserAgent, which wipes navigator.userAgentData), so that it stays consistent with
     * the real browser. Retrieved once by launching a temporary browser, and cached.
     * @returns {Promise<string>}
     */
    getUserAgent() {
        if (this.userAgent) return Promise.resolve(this.userAgent);
        return puppeteer.launch(this.browserOptions).then(browser => {
            return browser.userAgent().finally(() => browser.close());
        }).then(userAgent => {
            this.userAgent = userAgent.replace("HeadlessChrome", "Chrome");
            logger.info(`Using user agent: ${this.userAgent}`);
            return this.userAgent;
        });
    }

    close() {
        logger.info(`Shutting down connector ..`);
        return this.closeCurrentBrowser();
    }

    closeCurrentBrowser() {
        logger.info(`Closing current ${this.currentBrowserKind} browser...`);

        return Promise.resolve().then(() => {
            return this.currentBrowserPage && this.currentBrowserPage.close();
        }).then(() => {
            return this.currentBrowser && this.currentBrowser.close();
        }).then(() => {
            this.currentBrowserKind = null;
            this.currentBrowser = null;
            this.currentBrowserPage = null;
            this.currentBrowserFetches = 0;
        });
    }
}

// ---------

module.exports = Browser;

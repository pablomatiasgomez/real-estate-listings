'use strict';

const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const UserAgents = require('user-agents');

const ZonaPropBrowser = include('connector/browsers/zonaprop-browser');
const ZonaPropListingsBrowser = include('connector/browsers/zonaprop-listings-browser');
const ArgenPropBrowser = include('connector/browsers/argenprop-browser');
const ArgenPropListingsBrowser = include('connector/browsers/argenprop-listings-browser');
const MercadoLibreBrowser = include('connector/browsers/mercadolibre-browser');
const MercadoLibreListingsBrowser = include('connector/browsers/mercadolibre-listings-browser');
const ProperatiBrowser = include('connector/browsers/properati-browser');
const ProperatiListingsBrowser = include('connector/browsers/properati-listings-browser');
const EnBuenosAiresBrowser = include('connector/browsers/enbuenosaires-browser');
const EnBuenosAiresListingsBrowser = include('connector/browsers/enbuenosaires-listings-browser');
const RemaxBrowser = include('connector/browsers/remax-browser');
const RemaxListingsBrowser = include('connector/browsers/remax-listings-browser');
const LaGranInmobiliariaBrowser = include('connector/browsers/lagraninmobiliaria-browser');
const LaGranInmobiliariaListingsBrowser = include('connector/browsers/lagraninmobiliaria-listings-browser');
const MalumaBrowser = include('connector/browsers/maluma-browser');
const ICasasBrowser = include('connector/browsers/icasas-browser');
const ICasasListingsBrowser = include('connector/browsers/icasas-listings-browser');
const SiGroupBrowser = include('connector/browsers/sigroup-browser');
const CabaPropBrowser = include('connector/browsers/cabaprop-browser');
const CabaPropListingsBrowser = include('connector/browsers/cabaprop-listings-browser');
const VarcasiaBrowser = include('connector/browsers/varcasia-browser');
const MagnaccaBrowser = include('connector/browsers/magnacca-browser');
const MenendezPropBrowser = include('connector/browsers/menendezprop-browser');
const MenendezPropListingsBrowser = include('connector/browsers/menendezprop-listings-browser');
const MeMudoYaBrowser = include('connector/browsers/memudoya-browser');
const MeMudoYaListingsBrowser = include('connector/browsers/memudoya-listings-browser');
const LiderPropBrowser = include('connector/browsers/liderprop-browser');
const LiderPropListingsBrowser = include('connector/browsers/liderprop-listings-browser');
const SaadCenturionBrowser = include('connector/browsers/saadcenturion-browser');
const GrupoMegaBrowser = include('connector/browsers/grupomega-browser');
const GrupoMegaListingsBrowser = include('connector/browsers/grupomega-listings-browser');

const logger = include('utils/logger').newLogger('Browser');

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
    new SaadCenturionBrowser(),
    new GrupoMegaBrowser(),
    new GrupoMegaListingsBrowser(),
];

/**
 * @constructor
 */
function Browser() {
    this.browser = null;
}

Browser.BROWSER_KINDS = {
    "NORMAL": "NORMAL",
    "STEALTH": "STEALTH",
};

Browser.prototype.init = function () {
    let self = this;

    self.userAgents = new UserAgents();
    self.browserOptions = {
        headless: !DEBUG,
        devtools: DEBUG,
        args: [
            // TODO! `--js-flags="--max-old-space-size=${Math.floor(config.browser.maxOldSpaceSizeMb / 2)}"`,
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-sandbox',
            '--no-zygote',
            '--single-process',
        ],
    };
    self.currentBrowserKind = null;
    self.currentBrowser = null;
    self.currentBrowserPage = null;
    puppeteerExtra.use(StealthPlugin());
};

Browser.prototype.getBrowserPage = function (browserKind) {
    let self = this;
    if (browserKind === self.currentBrowserKind) {
        logger.info(`Reusing browser page for kind ${browserKind}..`);
        return Promise.resolve(self.currentBrowserPage);
    }

    // First we close the previous browser. We want to only keep one browser open at a time to reduce memory usage.
    // We also reuse the open browser page as we experienced chrome memory leaks if closing and reopening a new one every time.
    return self.closeCurrentBrowser().then(() => {
        self.currentBrowserKind = browserKind;
        let launcher = browserKind === Browser.BROWSER_KINDS.NORMAL ? puppeteer : puppeteerExtra;
        return launcher.launch(self.browserOptions);
    }).then(browser => {
        self.currentBrowser = browser;
        return self.currentBrowser.newPage();
    }).then(page => {
        self.currentBrowserPage = page;
        return self.currentBrowserPage;
    });
};

Browser.prototype.fetchData = function (url) {
    let self = this;

    let siteBrowsers = SITE_BROWSERS.filter(siteBrowser => siteBrowser.acceptsUrl(url));
    if (siteBrowsers.length > 1) {
        throw "More than one siteBrowsers match the same url: " + siteBrowsers.map(siteBrowser => siteBrowser.name());
    }
    if (!siteBrowsers.length) {
        logger.info(`No site browser matches url ${url}`);
        return Promise.resolve(null);
    }

    let siteBrowser = siteBrowsers[0];
    return Promise.resolve().then(() => {
        let browserKind = siteBrowser.useStealthBrowser() ? Browser.BROWSER_KINDS.STEALTH : Browser.BROWSER_KINDS.NORMAL;
        logger.info(`Getting url ${url} using ${siteBrowser.name()} with ${browserKind} browser..`);
        return self.getBrowserPage(browserKind);
    }).then(page => {
        let data;
        return Promise.resolve().then(() => {
            let javascriptEnabled = siteBrowser.withJavascriptEnabled();
            return page.setJavaScriptEnabled(javascriptEnabled);
        }).then(() => {
            // Randomize user agent
            return page.setUserAgent(self.userAgents.toString());
        }).then(() => {
            return siteBrowser.extractUrlData(page, url);
        }).then(d => {
            logger.info(`Data fetched from url ${url} : `, JSON.stringify(d).length);
            data = d;
        }).then(() => {
            return {
                id: siteBrowser.name() + "-" + siteBrowser.getId(url),
                url: url,
                data: data
            };
        }).catch(e => {
            logger.error(`Failed to fetch data for url ${url} `, e);
            throw e;
        });
    });
};

Browser.prototype.dispose = function () {
    let self = this;
    logger.info(`Shutting down connector ..`);
    return self.closeCurrentBrowser();
};

Browser.prototype.closeCurrentBrowser = function () {
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
    return promise;
};

// ---------

module.exports = Browser;

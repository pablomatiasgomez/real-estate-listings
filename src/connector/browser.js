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
const EnBuenosAiresBrowser = include('connector/browsers/enbuenosaires-browser');
const EnBuenosAiresListingsBrowser = include('connector/browsers/enbuenosaires-listings-browser');
const RemaxBrowser = include('connector/browsers/remax-browser');
const LaGranInmobiliariaBrowser = include('connector/browsers/lagraninmobiliaria-browser');
const MalumaBrowser = include('connector/browsers/maluma-browser');
const ICasasBrowser = include('connector/browsers/icasas-browser');
const SiGroupBrowser = include('connector/browsers/sigroup-browser');
const CabaPropBrowser = include('connector/browsers/cabaprop-browser');
const CabaPropListingsBrowser = include('connector/browsers/cabaprop-listings-browser');
const VarcasiaBrowser = include('connector/browsers/varcasia-browser');

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
    new EnBuenosAiresBrowser(),
    new EnBuenosAiresListingsBrowser(),
    new RemaxBrowser(),
    new LaGranInmobiliariaBrowser(),
    new MalumaBrowser(),
    new ICasasBrowser(),
    new SiGroupBrowser(),
    new CabaPropBrowser(),
    new CabaPropListingsBrowser(),
    new VarcasiaBrowser(),
];

function Browser() {
    this.browser = null;
}

Browser.prototype.init = function () {
    let self = this;

    self.userAgents = new UserAgents();
    let browserOptions = {
        headless: !DEBUG,
        devtools: DEBUG,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    return Promise.resolve().then(() => {
        return puppeteer.launch(browserOptions);
    }).then(normalBrowser => {
        self.normalBrowser = normalBrowser;
    }).then(() => {
        puppeteerExtra.use(StealthPlugin());
        return puppeteerExtra.launch(browserOptions);
    }).then(stealthBrowser => {
        self.stealthBrowser = stealthBrowser;
    });
};

Browser.prototype.fetchData = function (url) {
    let self = this;

    let siteBrowser = SITE_BROWSERS.filter(siteBrowser => siteBrowser.acceptsUrl(url))[0];
    if (!siteBrowser) {
        logger.info(`No site browser matches url ${url}`);
        return Promise.resolve(null);
    }

    return Promise.resolve().then(() => {
        let useStealthBrowser = siteBrowser.useStealthBrowser && siteBrowser.useStealthBrowser();
        logger.info(`Getting url ${url} using ${siteBrowser.name()} with ${useStealthBrowser ? 'stealth' : 'normal'} browser..`);
        return (useStealthBrowser ? self.stealthBrowser : self.normalBrowser).newPage();
    }).then(page => {
        let data;
        return Promise.resolve().then(() => {
            let javascriptEnabled = !siteBrowser.withJavascriptDisabled || !siteBrowser.withJavascriptDisabled();
            return page.setJavaScriptEnabled(javascriptEnabled);
        }).then(() => {
            // Randomize user agent
            return page.setUserAgent(self.userAgents.toString());
        }).then(() => {
            return page.goto(url, {
                waitUntil: 'load',
                timeout: 60 * 1000,
                referer: "https://www.google.com/"
            });
        }).delay(8000).then(() => {
            return siteBrowser.extractData(page);
        }).delay(2000).then(d => {
            logger.info(`Data fetched from url ${url} : `, JSON.stringify(d).length);
            data = d;
            return page.close();
        }).then(() => {
            return {
                id: siteBrowser.name() + "-" + siteBrowser.getId(url),
                url: url,
                data: data
            };
        }).catch(e => {
            logger.error(`Failed to fetch data for url ${url} `, e);
            console.error(e);
            throw e;
        });
    });
};

Browser.prototype.dispose = function () {
    logger.info(`Shutting down connector ..`);

    let self = this;
    return Promise.resolve().then(() => {
        if (self.normalBrowser) {
            return self.normalBrowser.close();
        }
    }).then(() => {
        if (self.stealthBrowser) {
            return self.stealthBrowser.close();
        }
    });
};

// ---------

module.exports = Browser;

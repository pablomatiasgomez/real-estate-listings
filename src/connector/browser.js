'use strict';

const puppeteer = require('puppeteer');

const ZonaPropBrowser = include('connector/browsers/zonaprop-browser');
const ArgenPropBrowser = include('connector/browsers/argenprop-browser');
const MercadoLibreBrowser = include('connector/browsers/mercadolibre-browser');
const ProperatiBrowser = include('connector/browsers/properati-browser');
const EnBuenosAiresBrowser = include('connector/browsers/enbuenosaires-browser');
const RemaxBrowser = include('connector/browsers/remax-browser');
const LaGranInmobiliariaBrowser = include('connector/browsers/lagraninmobiliaria-browser');
const MalumaBrowser = include('connector/browsers/maluma-browser');
const ICasasBrowser = include('connector/browsers/icasas-browser');
const SiGroupBrowser = include('connector/browsers/sigroup-browser');
const CabaPropBrowser = include('connector/browsers/cabaprop-browser');
const VarcasiaBrowser = include('connector/browsers/varcasia-browser');

const logger = include('utils/logger').newLogger('Browser');

//---------------

const DEBUG = false;

const SITE_BROWSERS = [
    new ZonaPropBrowser(),
    new ArgenPropBrowser(),
    new MercadoLibreBrowser(),
    new ProperatiBrowser(),
    new EnBuenosAiresBrowser(),
    new RemaxBrowser(),
    new LaGranInmobiliariaBrowser(),
    new MalumaBrowser(),
    new ICasasBrowser(),
    new SiGroupBrowser(),
    new CabaPropBrowser(),
    new VarcasiaBrowser(),
];

function Browser() {
    this.browser = null;
}

Browser.prototype.init = function () {
    let self = this;

    return Promise.resolve().then(() => {
        return puppeteer.launch({
            headless: !DEBUG,
            devtools: DEBUG,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // TODO: use the same profile every time
            // https://github.com/puppeteer/puppeteer/issues/866
        });
    }).then(browser => {
        self.browser = browser;
    });
};

Browser.prototype.fetchData = function (url) {
    let self = this;

    let siteBrowser = SITE_BROWSERS.filter(siteBrowser => siteBrowser.acceptsUrl(url))[0];
    if (!siteBrowser) {
        logger.error(`No site browser matches url ${url}`);
        throw `No site browser matches url ${url}`;
    }

    logger.info(`Getting url ${url} using ${siteBrowser.name()} ..`);
    return Promise.resolve().then(() => {
        return self.browser.newPage();
    }).then(page => {
        let data;
        return Promise.resolve().then(() => {
            return page.goto(url, {
                waitUntil: 'load',
                timeout: 60 * 1000,
                referer: "https://www.google.com/"
            });
        }).delay(5000).then(() => {
            return siteBrowser.extractData(page);
        }).delay(3000).then(d => {
            logger.info(`Data fetched from url ${url}: `, JSON.stringify(d).length);
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
            throw e;
        });
    });
};

Browser.prototype.dispose = function () {
    logger.info(`Shutting down connector ..`);

    let self = this;
    return Promise.resolve().then(() => {
        if (self.browser) {
            return self.browser.close();
        }
    });
};

// ---------

module.exports = Browser;

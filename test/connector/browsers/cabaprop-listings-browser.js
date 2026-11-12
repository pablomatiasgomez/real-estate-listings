'use strict';

require('../../globals');

const assert = require('assert');

const CabaPropListingsBrowser = require('../../../src/connector/browsers/cabaprop-listings-browser.js');
const CabaPropBrowser = require('../../../src/connector/browsers/cabaprop-browser.js');

// ---------

describe('CabaPropListingsBrowser URL_REGEX', function () {
    const browser = new CabaPropListingsBrowser();
    const url = 'https://cabaprop.com.ar/propiedades?op=venta&tipo=2&b=31%2C32%2C33&coch=4&max=800000&moneda=USD&orden=precio-asc';

    it('matches a list URL and uses the query string as id', function () {
        assert.ok(browser.acceptsUrl(url));
        assert.strictEqual(browser.getId(url), 'op=venta&tipo=2&b=31%2C32%2C33&coch=4&max=800000&moneda=USD&orden=precio-asc');
    });

    it('does not match individual listing URLs', function () {
        const individualUrl = 'https://cabaprop.com.ar/propiedad/64d0a57ad7bb11178d076f07/venta-duplex-4ambientes';
        assert.ok(!browser.acceptsUrl(individualUrl));
        assert.ok(new CabaPropBrowser().acceptsUrl(individualUrl));
        assert.ok(!new CabaPropBrowser().acceptsUrl(url));
    });
});

describe('CabaPropListingsBrowser getListPageUrl', function () {
    const browser = new CabaPropListingsBrowser();

    it('adds the page param when missing', function () {
        const url = browser.getListPageUrl('https://cabaprop.com.ar/propiedades?op=venta&tipo=2', 3);
        assert.strictEqual(url, 'https://cabaprop.com.ar/propiedades?op=venta&tipo=2&page=3');
    });

    it('replaces the page param when present', function () {
        const url = browser.getListPageUrl('https://cabaprop.com.ar/propiedades?page=1&op=venta', 2);
        assert.strictEqual(url, 'https://cabaprop.com.ar/propiedades?page=2&op=venta');
    });
});

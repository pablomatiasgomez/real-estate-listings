'use strict';

require('../../globals');

const assert = require('assert');

const ArgenPropListingsBrowser = require('../../../src/connector/browsers/argenprop-listings-browser.js');

// ---------

describe('ArgenPropListingsBrowser URL_REGEX', function () {
    const browser = new ArgenPropListingsBrowser();

    it('matches a list URL with no query string', function () {
        const url = 'https://www.argenprop.com/casas/venta/capital-federal';
        assert.ok(browser.acceptsUrl(url));
        assert.strictEqual(browser.getId(url), 'casas/venta/capital-federal');
    });

    it('matches a list URL with key-only query params and includes them in the id', function () {
        const url = 'https://www.argenprop.com/casas/venta/capital-federal/dolares-hasta-550000?4-o-mas-cocheras&solo-ver-dolares';
        assert.ok(browser.acceptsUrl(url));
        assert.strictEqual(browser.getId(url), 'casas/venta/capital-federal/dolares-hasta-550000?4-o-mas-cocheras&solo-ver-dolares');
    });

    it('matches a list URL with key=value query params and includes them in the id', function () {
        const url = 'https://www.argenprop.com/casas/venta?precio=1000&moneda=USD';
        assert.ok(browser.acceptsUrl(url));
        assert.strictEqual(browser.getId(url), 'casas/venta?precio=1000&moneda=USD');
    });

    it('does not match individual listing URLs (which contain --<id>)', function () {
        const url = 'https://www.argenprop.com/departamento-en-venta-palermo--12345';
        assert.ok(!browser.acceptsUrl(url));
    });
});

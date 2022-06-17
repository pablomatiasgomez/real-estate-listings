'use strict';

require('../globals');

const assert = require('assert');

const Utils = require('../../src/utils/utils.js');

// ---------

describe('delay()', function () {
    let someValue = "someValue";

    it('without any value', function () {
        let promise = Promise.resolve();
        let start = Date.now();
        return promise.then(Utils.delay(500)).then((value) => {
            let duration = Date.now() - start;
            assert.ok(duration > 500);
            assert.equal(value, undefined);
        });
    });

    it('with values', function () {
        let promise = Promise.resolve(someValue);
        let start = Date.now();
        return promise.then(Utils.delay(500)).then((value) => {
            let duration = Date.now() - start;
            assert.ok(duration > 500);
            assert.equal(value, value);
        });
    });

    it('with 0 delay', function () {
        let promise = Promise.resolve(someValue);
        let start = Date.now();
        return promise.then(Utils.delay(0)).then((value) => {
            let duration = Date.now() - start;
            assert.ok(duration < 100); // Should be less than 5ms, but 100ms is safe for the test.
            assert.equal(value, value);
        });
    });
});

'use strict';

require('../globals');

const assert = require('assert');
const sinon = require("sinon");

const DifferenceNotifierService = require('../../src/service/difference-notifier-service.js');
const NotifierService = require('../../src/service/notifier-service.js');
const FileDataRepository = require('../../src/repository/file-data-repository.js');
const Browser = require('../../src/connector/browser.js');

// ---------

let fileDataRepository;
let browser;
let notifierService;
let differenceNotifierService;

beforeEach(function () {
    fileDataRepository = sinon.createStubInstance(FileDataRepository);
    browser = sinon.createStubInstance(Browser);
    notifierService = sinon.createStubInstance(NotifierService);
    differenceNotifierService = new DifferenceNotifierService(fileDataRepository, browser, notifierService);
});

describe('verifyDataDifference()', function () {
    let id = "5";
    let url = `https://example.com/path-to-id-${id}`;
    let newData = {
        EXPORT_VERSION: 1,
        url: url,
        oldField: "oldValue",
        newField: "newValue",
    };

    it('happy path with difference', function () {
        fileDataRepository.getLastDataFile.callsFake(id => Promise.resolve({
            EXPORT_VERSION: 1,
            url: `https://example.com/path-to-id-${id}`,
            oldField: "oldValue",
        }));
        notifierService.notify.returns(Promise.resolve());

        return differenceNotifierService.verifyDataDifference(url, id, newData).then(hadDifference => {
            assert.equal(hadDifference, true);

            sinon.assert.calledWith(fileDataRepository.getLastDataFile, id);

            let expectedMessage = `A difference was found for: \n` +
                `ID: ${id}\n` +
                `URL: ${url}\n\n` +
                ` {\n+  newField: "newValue"\n   url: "https://example.com/path-to-id-5"\n }\n`;
            sinon.assert.calledWith(notifierService.notify, expectedMessage);
        });
    });

    it('no previous data', function () {
        fileDataRepository.getLastDataFile.returns(Promise.resolve(null));
        notifierService.notify.returns(Promise.resolve());

        return differenceNotifierService.verifyDataDifference(url, id, newData).then(hadDifference => {
            assert.equal(hadDifference, false);
            sinon.assert.calledWith(fileDataRepository.getLastDataFile, id);
            sinon.assert.notCalled(notifierService.notify);
        });
    });

    it('different export versions', function () {
        fileDataRepository.getLastDataFile.callsFake(() => Promise.resolve({
            EXPORT_VERSION: 123, // different
            oldField: "oldValue",
        }));
        notifierService.notify.returns(Promise.resolve());

        return differenceNotifierService.verifyDataDifference(url, id, newData).then(hadDifference => {
            assert.equal(hadDifference, false);
            sinon.assert.calledWith(fileDataRepository.getLastDataFile, id);
            sinon.assert.notCalled(notifierService.notify);
        });
    });

    it('no difference', function () {
        fileDataRepository.getLastDataFile.returns(Promise.resolve(newData));
        notifierService.notify.returns(Promise.resolve());

        return differenceNotifierService.verifyDataDifference(url, id, newData).then(hadDifference => {
            assert.equal(hadDifference, false);
            sinon.assert.calledWith(fileDataRepository.getLastDataFile, id);
            sinon.assert.notCalled(notifierService.notify);
        });
    });
});


describe('exportData()', function () {
    let dataForUrl = url => {
        return {
            url: url,
            id: url.slice(-1),
            data: {
                EXPORT_VERSION: 1,
                oldField: "oldValue",
                newField: "newValue",
            }
        };
    };

    it('happy path with all cases', function () {
        // We will process 4 urls: 1 difference, 1 with no difference, 1 error, 1 skipped.
        let urlWithDifference = `https://example.com/path-to-id-1`;
        let urlWithNoDifference = `https://example.com/path-to-id-2`;
        let urlWithError = `https://example.com/path-to-id-3`;
        let urlSkipped = `https://example.com/path-to-id-4`;
        let urls = [urlWithDifference, urlWithNoDifference, urlWithError, urlSkipped];

        let browserData = {
            [urlWithDifference]: Promise.resolve(dataForUrl(urlWithDifference)),
            [urlWithNoDifference]: Promise.resolve(dataForUrl(urlWithNoDifference)),
            [urlWithError]: Promise.reject(`Error getting ${urlWithError}`),
        };
        browser.fetchData.callsFake(url => browserData[url]);

        let urlWithDifferenceData = dataForUrl(urlWithDifference).data;
        delete urlWithDifferenceData.newField;
        let lastDataFile = {
            [urlWithDifference.slice(-1)]: urlWithDifferenceData,
            [urlWithNoDifference.slice(-1)]: dataForUrl(urlWithNoDifference).data,
        };
        fileDataRepository.getLastDataFile.callsFake(id => Promise.resolve(lastDataFile[id]));

        notifierService.notify.returns(Promise.resolve());

        return differenceNotifierService.exportData(urls).then(() => {
            sinon.assert.calledWith(fileDataRepository.getLastDataFile, "1");
            sinon.assert.calledWith(fileDataRepository.getLastDataFile, "2");

            let expectedMessage = `A difference was found for: \n` +
                `ID: 1\n` +
                `URL: ${urlWithDifference}\n\n` +
                ` {\n+  newField: "newValue"\n }\n`;
            sinon.assert.calledWith(notifierService.notify, expectedMessage);

            expectedMessage = `Finished checking 4 urls (1 skipped) in 0 minutes, with 1 differences, and 1 errors.`;
            sinon.assert.calledWith(notifierService.notify, expectedMessage);
        });
    });
});
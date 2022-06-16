'use strict';

require('../globals');

const assert = require('assert');
const sinon = require("sinon");

const DifferenceNotifierService = require('../../src/service/difference-notifier-service.js');
const NotifierService = require('../../src/service/notifier-service.js');
const FileDataRepository = require('../../src/repository/file-data-repository.js');
const Browser = require('../../src/connector/browser.js');

describe('verifyDataDifference()', function () {
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

    let id = "5";
    let url = `https://example.com/path-to-id-${id}`;
    let newData = {
        EXPORT_VERSION: 1,
        url: url,
        newField: "newValue",
    };

    it('happy path with difference', function () {
        fileDataRepository.getLastDataFile.callsFake(id => Promise.resolve({
            EXPORT_VERSION: 1,
            url: `https://example.com/path-to-id-${id}`,
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
        fileDataRepository.getLastDataFile.callsFake(id => Promise.resolve({
            EXPORT_VERSION: 123, // different
            url: `https://example.com/path-to-id-${id}`,
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


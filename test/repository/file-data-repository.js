'use strict';

require('../globals');

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require('assert');

const FileDataRepository = require('../../src/repository/file-data-repository');

const Utils = require("../../src/utils/utils");

// ---------

let fileDataRepository = new FileDataRepository();

let oldProjectDir = __project_dir;
let testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'real-estate-listings'));
before(function () {
    oldProjectDir = __project_dir;
    global.__project_dir = testProjectDir;
});
after(function () {
    global.__project_dir = oldProjectDir;
});

describe('getFileDir()', function () {

    it('simple id', function () {
        let fileDir = fileDataRepository.getFileDir("1234567");
        assert.equal(fileDir, testProjectDir + "/exports/1234567");
    });

    it('complex id', function () {
        let fileDir = fileDataRepository.getFileDir("1/2?3<4>5:6*7|");
        assert.equal(fileDir, testProjectDir + "/exports/1234567");
    });

});

describe('getLastDataFile()', function () {

    it('no file', function () {
        let id = "no-file";
        return fileDataRepository.getLastDataFile(id).then(contents => {
            assert.equal(contents, null);
        });
    });

    it('one file', function () {
        let id = "one-file";
        return fileDataRepository.createNewDataFile(id, {field: "value1"}).then(() => {
            return fileDataRepository.getLastDataFile(id);
        }).then(contents => {
            assert.equal(JSON.stringify(contents), `{"field":"value1"}`);
        });
    });

    it('two files', function () {
        let id = "two-file";
        // Need to wait 1sec between creation as the filenames include up to seconds.
        return fileDataRepository.createNewDataFile(id, {field: "value1"}).then(Utils.delay(1000)).then(() => {
            return fileDataRepository.createNewDataFile(id, {field2: "value2"});
        }).then(() => {
            return fileDataRepository.getLastDataFile(id);
        }).then(contents => {
            assert.equal(JSON.stringify(contents), `{"field2":"value2"}`);
        });
    });

});


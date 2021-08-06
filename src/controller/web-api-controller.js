'use strict';

const express = require('express');
const async = require('async');
const NodeCache = require('node-cache');

const logger = include('utils/logger').newLogger('WebApiController');

//----------------------

function WebApiController(fileDataRepository, browser) {
    this.fileDataRepository = fileDataRepository;
    this.browser = browser;
    this.cache = new NodeCache({
        stdTTL: 12 * 60 * 60, // 12hs
        checkperiod: 60 * 60, // 1hr
        useClones: false      // return the reference
    });
    this.queue = this.createQueue();
}

// Creates a queue with concurrency 1 so that we have at most one open browser.
WebApiController.prototype.createQueue = function () {
    let self = this;

    return async.queue((url, resolve) => {
        let response = self.cache.get(url);
        if (response) {
            logger.info(`Cache hit for url ${url}`);
            return resolve(null, response);
        }

        logger.info(`Getting listing data for url ${url}`);
        self.getLastSavedData(url).then(lastSavedData => {
            if (!lastSavedData) {
                logger.info(`Couldn't find lastSavedData, going to fetch live data..`);
                return self.getLiveData(url);
            }
            return lastSavedData;
        }).then(data => {
            self.cache.set(url, data);
            resolve(null, data);
        }).catch(e => {
            resolve(e, null);
        });
    }, 1);
};

WebApiController.prototype.getLiveData = function (url) {
    let self = this;
    // TODO handle browser closing after the page is fetched
    return self.browser.fetchData(url).then(response => {
        if (!response) return null;
        return response.data;
    });
};

WebApiController.prototype.getLastSavedData = function (url) {
    let self = this;
    return Promise.resolve().then(() => {
        return self.browser.getUrlId(url);
    }).then(id => {
        if (!id) return null;
        return self.fileDataRepository.getLastDataFile(id);
    });
};

WebApiController.prototype.listen = function (port) {
    let self = this;
    logger.info(`Starting server on port ${port} ..`);

    let app = express();
    app.use(express.json());

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get("/listings", function (req, res) {
        let url = req.query.url;
        if (!url) return res.status(400).send("Invalid URL!");

        self.queue.push(url, (error, response) => {
            if (error) {
                logger.error(error);
                return res.status(500).send(error.message);
            } else if (!response) {
                return res.status(404);
            } else {
                return res.send(response);
            }
        });
    });

    app.get("/stats", function (req, res) {
        res.send(self.cache.getStats());
    });

    self.server = app.listen(port, () => logger.info(`Started API on port ${port}`));
};

WebApiController.prototype.close = function () {
    let self = this;
    logger.info(`Shutting down server gracefully...`);

    return new Promise(resolve => {
        if (!self.server) return;
        return self.server.close(resolve);
    });
};

module.exports = WebApiController;

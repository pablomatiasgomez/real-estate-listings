#!/usr/bin/env node
'use strict';

global.__project_dir = __dirname + '/..';
global.newLogger = className => require('./utils/logger.js').newLogger(className);
global.config = Object.assign(require('./config.js'), require(`${__project_dir}/config.json`));
global.Promise = require('bluebird');

const TerminalFont = require('./utils/terminal-font.js');
const Utils = require('./utils/utils.js');

const WebApiController = require('./controller/web-api-controller.js');
const DifferenceNotifierService = require('./service/difference-notifier-service.js');
const NotifierService = require('./service/notifier-service.js');
const GoogleSheetsService = require('./service/googlesheets-service.js');
const FileReaderService = require('./service/filereader-service.js');
const FileDataRepository = require('./repository/file-data-repository.js');
const Browser = require('./connector/browser.js');

//----------------------

const logger = newLogger('Main');

//----------------------

Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
};

//----------------------

function getUrls() {
    let providers = [];

    if (config.urlsSource.googleSheet.enabled) {
        providers.push(new GoogleSheetsService().getUrls());
    }
    if (config.urlsSource.files.enabled) {
        let fileReaderService = new FileReaderService();
        providers.push(...config.urlsSource.files.files
            .map(file => `${__project_dir}/${file}`)
            .map(filePath => fileReaderService.readFileUrls(filePath)));
    }

    return Promise.all(providers).then(results => {
        let urls = [].concat.apply([], results);
        return urls.shuffle();
    });
}

function initServicesAndExecute() {
    logger.info('');
    logger.info('|==================================================================================');
    logger.info(`|                          ${TerminalFont.Bright}Real Estate Listings${TerminalFont.Reset}`);
    logger.info('|==================================================================================');
    logger.info(`| Git changeset: ${Utils.CURRENT_BUILD.changeset}`);
    logger.info(`| Git branch: ${Utils.CURRENT_BUILD.branch}`);
    logger.info('|==================================================================================');
    logger.info('');

    let browser;
    let fileDataRepository;
    let notifierService;
    let differenceNotifierService;
    let webApiController;

    const ACTIONS = {
        "--diff-check": () => getUrls().then(urls => differenceNotifierService.exportData(urls)),
        "--web-api": () => {
            webApiController.listen(8200);
            return new Promise(resolve => {
                process.on("SIGTERM", () => webApiController.close(resolve));
                process.on("SIGINT", () => webApiController.close(resolve));
            });
        }
    };

    let action = ACTIONS[process.argv.slice(2)[0]];
    if (!action) {
        logger.error(`Invalid action: ${process.argv.slice(2)[0]}. Valid actions are: ${Object.keys(ACTIONS).join(", ")}`);
        return;
    }

    return Promise.resolve().then(() => {
        fileDataRepository = new FileDataRepository();
        browser = new Browser();
        notifierService = new NotifierService();
        differenceNotifierService = new DifferenceNotifierService(fileDataRepository, browser, notifierService);
        webApiController = new WebApiController(fileDataRepository, browser);
    }).then(action).catch(e => {
        return logger.error("Error executing action!", e);
    }).finally(() => {
        logger.info(`Shutting down the browser..`);
        return browser.close();
    });
}

initServicesAndExecute();

#!/usr/bin/env node
'use strict';

global.__project_dir = __dirname + '/..';
global.__src_dir = __dirname;
global.include = file => require(__src_dir + '/' + file);
global.config = Object.assign(include('config'), require(`${__project_dir}/config.json`));
global.Promise = require('bluebird');

const TerminalFont = include('utils/terminal-font');
const Utils = include('utils/utils');

const Browser = include('connector/browser');

const ExportService = include('service/export-service');
const NotifierService = include('service/notifier-service');
const GoogleSheetsService = include('service/googlesheets-service');
const FileReaderService = include('service/filereader-service');

//----------------------

const logger = include('utils/logger').newLogger('Main');

//----------------------

Array.prototype.flatMap = function (lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
};

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
        let filePromises = config.urlsSource.files.files
            .map(file => `${__project_dir}/${file}`)
            .map(filePath => fileReaderService.readFileUrls(filePath));
        providers.push(...filePromises);
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

    return Promise.resolve().then(() => {
        browser = new Browser();
        return browser.init();
    }).then(() => {
        return getUrls();
    }).then(urls => {
        let notifierService = new NotifierService();
        let exportService = new ExportService(browser, notifierService);
        return exportService.exportData(urls);
    }).finally(() => {
        logger.info(`Shutting down the browser..`);
        return browser.dispose();
    });
}

let promise = initServicesAndExecute();

module.exports = promise;

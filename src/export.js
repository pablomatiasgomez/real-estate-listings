#!/usr/bin/env node
'use strict';

global.__project_dir = __dirname + '/..';
global.__src_dir = __dirname;
global.include = file => require(__src_dir + '/' + file);
global.Promise = require('bluebird');

const TerminalFont = include('utils/terminal-font');
const Utils = include('utils/utils');

const Browser = include('connector/browser');

const ExportService = include('service/export-service');
const NotifierService = include('service/notifier-service');
const GoogleSheetsService = include('service/googlesheets-service');

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
};

//----------------------

const USE_GOOGLE_SHEETS_URLS = true;

let browser;

//----------------------

function getUrls() {
    let provider;
    if (USE_GOOGLE_SHEETS_URLS) {
        provider = () => new GoogleSheetsService().getUrls();
    } else {
        provider = () => {
            return Utils.readFile(`${__project_dir}/config/urls.txt`).then(content => {
                return content.split("\n")
                    .map(url => url.trim())
                    .filter(url => !!url && !url.startsWith("//"));
            });
        };
    }
    return provider().then(urls => {
        urls.shuffle();
        return urls;
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

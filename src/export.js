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

//----------------------

const logger = include('utils/logger').newLogger('Main');

//----------------------

Array.prototype.flatMap = function (lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
};

//----------------------

let browser;
let exportService;

//----------------------

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
        return Promise.all([
            Utils.readFile(`${__project_dir}/urls.txt`),
            Utils.readFile(`${__project_dir}/telegram-token`),
        ]);
    }).then((urls, telegramToken) => {
        urls = urls.split("\n").filter(url => !!url);
        let notifierService = new NotifierService(telegramToken);
        exportService = new ExportService(browser, notifierService);
        return exportService.exportData(urls);
    }).finally(() => {
        logger.info(`Shutting down the browser..`);
        return browser.dispose();
    });
}

let promise = initServicesAndExecute();


module.exports = promise;

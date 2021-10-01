'use strict';

const GoogleSpreadsheet = require('google-spreadsheet').GoogleSpreadsheet;
const GoogleSpreadsheetUtils = require('google-spreadsheet/lib/utils');

const logger = newLogger('GoogleSheetsService');

//----------------------

class GoogleSheetsService {
    constructor() {
        this.doc = new GoogleSpreadsheet(config.urlsSource.googleSheet.spreadsheetId);
    }

    getUrls() {
        let self = this;
        return self.doc.useServiceAccountAuth(config.urlsSource.googleSheet.credentials).then(() => {
            return self.doc.loadInfo();
        }).then(() => {
            let urls = [];
            let promise = Promise.resolve();
            Object.values(self.doc.sheetsByIndex).forEach(sheet => {
                promise = promise.then(() => {
                    return self.getUrlsFromSheet(sheet);
                }).then(sheetUrls => {
                    logger.info(`Got ${sheetUrls.length} urls from sheet ${sheet.title}`);
                    urls.push(...sheetUrls);
                });
            });
            return promise.then(() => urls);
        });
    }

    getUrlsFromSheet(sheet) {
        logger.info(`Getting urls from sheet ${sheet.title}`);
        return Promise.resolve().then(() => {
            return sheet.getCellsInRange('A1:Z1');
        }).then(cells => {
            if (!cells) return [];

            let columnIndex = cells[0].indexOf("links");
            if (columnIndex === -1) return [];

            let columnLetter = GoogleSpreadsheetUtils.columnToLetter(columnIndex + 1);
            logger.info(`Using column ${columnLetter}`);

            return sheet.getCellsInRange(`${columnLetter}2:${columnLetter}1000`);
        }).then(cells => {
            return cells
                .flatMap(cell => cell[0])
                .filter(link => !!link)
                .map(link => link.trim());
        });
    }
}

module.exports = GoogleSheetsService;

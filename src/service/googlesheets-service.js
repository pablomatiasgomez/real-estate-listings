'use strict';

const GoogleSpreadsheet = require('google-spreadsheet').GoogleSpreadsheet;
const JWT = require('google-auth-library').JWT;

const logger = newLogger('GoogleSheetsService');

//----------------------

class GoogleSheetsService {
    constructor() {
        const jwt = new JWT({
            email: config.urlsSource.googleSheet.credentials.client_email,
            key: config.urlsSource.googleSheet.credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.doc = new GoogleSpreadsheet(config.urlsSource.googleSheet.spreadsheetId, jwt);
    }

    getUrls() {
        let self = this;
        return Promise.resolve().then(() => {
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
        let self = this;
        logger.info(`Getting urls from sheet ${sheet.title}`);
        return Promise.resolve().then(() => {
            return sheet.getCellsInRange('A1:Z1');
        }).then(cells => {
            if (!cells) return [];

            let columnIndex = cells[0].indexOf("links");
            if (columnIndex === -1) return [];

            let columnLetter = self.columnToLetter(columnIndex + 1);
            logger.info(`Using column ${columnLetter}`);

            return sheet.getCellsInRange(`${columnLetter}2:${columnLetter}1000`);
        }).then(cells => {
            return cells
                .flatMap(cell => cell[0])
                .filter(link => !!link)
                .map(link => link.trim());
        });
    }

    // Copied from 'google-spreadsheet/lib/utils' as it is not exported.
    columnToLetter(columnIndex) {
        let temp;
        let letter = '';
        let col = columnIndex;
        while (col > 0) {
            temp = (col - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            col = (col - temp - 1) / 26;
        }
        return letter;
    }

}

module.exports = GoogleSheetsService;

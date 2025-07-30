'use strict';

const GoogleSheets = require('@googleapis/sheets');

const logger = newLogger('GoogleSheetsService');

//----------------------

class GoogleSheetsService {

    constructor() {
        let auth = new GoogleSheets.auth.GoogleAuth({
            credentials: config.urlsSource.googleSheet.credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = GoogleSheets.sheets({version: 'v4', auth: auth});
        this.spreadsheetId = config.urlsSource.googleSheet.spreadsheetId;
    }

    getUrls() {
        return this.sheets.spreadsheets.get({
            spreadsheetId: config.urlsSource.googleSheet.spreadsheetId,
        }).then(spreadsheet => {
            let sheetNames = spreadsheet.data.sheets.map(s => s.properties.title);
            logger.info(`Got ${sheetNames.length} sheets from spreadsheet: '${spreadsheet.data.properties.title}'`);

            let urls = [];
            let promise = Promise.resolve();
            sheetNames.forEach(sheetName => {
                promise = promise.then(() => {
                    return this.getUrlsFromSheet(sheetName);
                }).then(sheetUrls => {
                    logger.info(`Got ${sheetUrls.length} urls from sheet ${sheetName}`);
                    urls.push(...sheetUrls);
                });
            });
            return promise.then(() => urls);
        });
    }

    getUrlsFromSheet(sheetName) {
        logger.info(`Getting urls from sheet ${sheetName}`);
        return this.getRowsInRange(sheetName, "A1:Z1").then(rows => {
            if (!rows || !rows.length) return [];

            let columnIndex = rows[0].indexOf("links");
            if (columnIndex === -1) return [];

            let columnLetter = this.columnToLetter(columnIndex + 1);
            logger.info(`Using column ${columnLetter}`);

            return this.getRowsInRange(sheetName, `${columnLetter}2:${columnLetter}1000`);
        }).then(cells => {
            return cells
                .flatMap(cell => cell[0])
                .filter(link => !!link)
                .map(link => link.trim());
        });
    }

    getRowsInRange(sheetName, range) {
        return this.sheets.spreadsheets.values.get({
            spreadsheetId: config.urlsSource.googleSheet.spreadsheetId,
            range: `${sheetName}!${range}`,
        }).then(res => {
            return res.data.values;
        });
    }

    // columnToLetter converts a columnNumber like 3 to a columnLetter like C
    columnToLetter(columnNumber) {
        let letter = '';
        while (columnNumber > 0) {
            const mod = (columnNumber - 1) % 26;
            letter = String.fromCharCode(mod + 65) + letter;
            columnNumber = (columnNumber - mod - 1) / 26;
        }
        return letter;
    }

}

module.exports = GoogleSheetsService;

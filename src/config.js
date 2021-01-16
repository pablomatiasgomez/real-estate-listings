'use strict';

let Config = {
    "urlsSource": {
        "googleSheet": {
            // Gets all the urls from all the sheets inside this spreadsheet
            // by looking up all the columns that have "links" as header.
            "enabled": false,
            "credentials": null,
            "spreadsheetId": null
        },
        "files": {
            // Reads the file line by line and ignores lines that start with "//" or are empty.
            "enabled": false,
            "files": []
        }
    },
    "telegram": {
        "token": null,
        // Can be retrieved using https://api.telegram.org/bot{TOKEN}/getUpdates
        "chatId": null
    }
};

module.exports = Config;
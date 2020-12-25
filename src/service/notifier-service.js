'use strict';

const Telegram = require('telegram-bot-api');

const logger = include('utils/logger').newLogger('NotifierService');

//----------------------

function NotifierService(token) {
    this.telegram = new Telegram({
        token: token
    });
}

NotifierService.prototype.notify = function (message) {
    let self = this;

    return self.telegram.sendMessage({
        // Got from https://api.telegram.org/bot{TOKEN}/getUpdates
        chat_id: "-498428304",
        text: message
    }).catch(e => {
        logger.error("Error while notifying to telegram.. ", e);
    });
};

module.exports = NotifierService;

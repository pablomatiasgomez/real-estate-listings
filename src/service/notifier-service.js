'use strict';

const Telegram = require('telegram-bot-api');

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('NotifierService');

//----------------------

function NotifierService(token) {
    this.telegram = new Telegram({
        token: token
    });
}

NotifierService.prototype.notify = function (message) {
    let self = this;

    // Telegram limit is 4096
    if (message.length > 4000) {
        message = message.substring(0, 4000) + " ... CROPPED";
    }

    return self.telegram.sendMessage({
        // Got from https://api.telegram.org/bot{TOKEN}/getUpdates
        chat_id: "-498428304",
        text: message
    }).catch(e => {
        logger.error("Error while notifying to telegram.. ", Utils.stringifyError(e));
    });
};

module.exports = NotifierService;

'use strict';

const Telegram = require('telegram-bot-api');

const Utils = include('utils/utils');

const logger = include('utils/logger').newLogger('NotifierService');

//----------------------

function NotifierService() {
    this.telegram = new Telegram({
        token: config.telegram.token
    });
}

NotifierService.prototype.notify = function (message) {
    let self = this;

    // Telegram limit is 4096
    if (message.length > 4000) {
        message = message.substring(0, 4000) + " ... (cropped)";
    }

    return self.telegram.sendMessage({
        chat_id: config.telegram.chatId,
        text: message
    }).catch(e => {
        logger.error("Error while notifying to telegram.. ", Utils.stringifyError(e));
    });
};

module.exports = NotifierService;

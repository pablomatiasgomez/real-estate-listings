'use strict';

const Telegram = require('telegram-bot-api');

const logger = include('utils/logger').newLogger('NotifierService');

//----------------------

const TELEGRAM_MESSAGE_BYTES_LIMIT = 4096;
const CROPPED_MESSAGE_SUFFIX = " ... (cropped)";

function NotifierService() {
    this.telegram = new Telegram({
        token: config.telegram.token
    });
}

NotifierService.prototype.notify = function (message) {
    let self = this;

    if (message.length > TELEGRAM_MESSAGE_BYTES_LIMIT) {
        logger.info(`Cropping message of length ${message.length}`);
        message = message.substring(0, TELEGRAM_MESSAGE_BYTES_LIMIT - CROPPED_MESSAGE_SUFFIX.length) + CROPPED_MESSAGE_SUFFIX;
    }

    return self.telegram.sendMessage({
        chat_id: config.telegram.chatId,
        text: message
    }).catch(e => {
        logger.error("Error while notifying to telegram.. ", e);
    });
};

module.exports = NotifierService;

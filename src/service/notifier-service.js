'use strict';

// TODO: migrate to "node-telegram-bot-api" once that dependency stops using "request"..
const TelegramBot = require('telegram-bot-api');

const logger = newLogger('NotifierService');

//----------------------

const TELEGRAM_MESSAGE_BYTES_LIMIT = 4096;
const CROPPED_MESSAGE_SUFFIX = " ... (cropped)";

class NotifierService {
    constructor() {
        this.telegramBot = new TelegramBot({
            token: config.telegram.token
        });
        this.chatId = config.telegram.chatId;
    }

    notify(message) {
        let self = this;

        if (message.length > TELEGRAM_MESSAGE_BYTES_LIMIT) {
            logger.info(`Cropping message of length ${message.length}`);
            message = message.substring(0, TELEGRAM_MESSAGE_BYTES_LIMIT - CROPPED_MESSAGE_SUFFIX.length) + CROPPED_MESSAGE_SUFFIX;
        }

        return self.telegramBot.sendMessage({
            chat_id: self.chatId,
            text: message
        }).catch(e => {
            logger.error("Error while notifying to telegram.. ", e);
        });
    }
}

module.exports = NotifierService;

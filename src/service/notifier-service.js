'use strict';

// TODO: migrate to "node-telegram-bot-api" once that dependency stops using "request"..
const TelegramBot = require('telegram-bot-api');

const Utils = require('../utils/utils.js');

const logger = newLogger('NotifierService');

//----------------------

const TELEGRAM_MESSAGE_BYTES_LIMIT = 4096;

class NotifierService {
    constructor() {
        this.telegramBot = new TelegramBot({
            token: config.telegram.token
        });
        this.chatId = config.telegram.chatId;
    }

    notify(message) {
        let promise = Promise.resolve();
        this.splitMessage(message).forEach(message => {
            promise = promise.then(() => {
                return this.telegramBot.sendMessage({
                    chat_id: this.chatId,
                    text: message
                }).catch(e => {
                    logger.error("Error while notifying to telegram.. ", e);
                });
            }).then(Utils.delay(200));
        });
        return promise;
    }

    // Splits the message into multiple messages so that it fits telegram's max byte limit.
    splitMessage(message) {
        if (message.length <= TELEGRAM_MESSAGE_BYTES_LIMIT) {
            return [message];
        }

        let splitIndex = message.lastIndexOf('\n', TELEGRAM_MESSAGE_BYTES_LIMIT);
        logger.info(`Splitting message of length ${message.length} at index ${splitIndex}`);

        let firstMessage = message.substring(0, splitIndex); // Not including the \n as it will be split into two messages
        let secondMessage = message.substring(splitIndex + 1);

        return [
            firstMessage,
            ...this.splitMessage(secondMessage),
        ];
    }
}

module.exports = NotifierService;

'use strict';

const Utils = require('../utils/utils.js');

const logger = newLogger('NotifierService');

//----------------------

const TELEGRAM_MESSAGE_BYTES_LIMIT = 4096;
const TELEGRAM_BASE_URL = 'https://api.telegram.org';
const MAX_SEND_RETRIES = 3;
const RETRY_BACKOFF_MS = 500;

class NotifierService {
    constructor() {
        this.token = config.telegram.token;
        this.chatId = config.telegram.chatId;
    }

    /**
     * notify will notify to the configured chatId, by splitting the message if needed.
     * @param {string} message
     * @returns {Promise<void>}
     */
    notify(message) {
        let promise = Promise.resolve();
        this.splitMessage(message).forEach(message => {
            promise = promise.then(() => {
                return this.sendWithRetry(message).catch(e => {
                    logger.error("Error while notifying to telegram.. ", e);
                });
            }).then(Utils.delay(200));
        });
        return promise;
    }

    /**
     * Splits a message into multiple messages if it exceeds Telegram's character limit.
     *
     * @param {string} message - The message to be split.
     * @returns {string[]} - An array of message segments.
     */
    splitMessage(message) {
        if (message.length <= TELEGRAM_MESSAGE_BYTES_LIMIT) {
            return [message];
        }

        let splitIndex = message.lastIndexOf('\n', TELEGRAM_MESSAGE_BYTES_LIMIT);
        logger.info(`Splitting message of length ${message.length} at index ${splitIndex}`);

        let firstMessage = message.substring(0, splitIndex); // Not including the \n as it will be split into two messages
        let secondMessage = message.substring(splitIndex + 1);

        return [firstMessage, ...this.splitMessage(secondMessage)];
    }

    /**
     * Sends the message, retrying up to MAX_SEND_RETRIES times with a small linear backoff on failure.
     * @param {string} message
     * @param {number} attempt - current attempt (1-based)
     * @returns {Promise<void>}
     */
    sendWithRetry(message, attempt = 1) {
        return this.sendMessage(message).catch(e => {
            if (attempt >= MAX_SEND_RETRIES) throw e;
            let backoffMs = RETRY_BACKOFF_MS * attempt;
            logger.info(`sendMessage attempt ${attempt}/${MAX_SEND_RETRIES} failed (${e.message}). Retrying in ${backoffMs}ms..`);
            return Utils.delay(backoffMs)().then(() => this.sendWithRetry(message, attempt + 1));
        });
    }

    /**
     * Actually sends the message to TelegramAPI.
     * @param message
     * @returns {Promise<void>}
     */
    sendMessage(message) {
        return fetch(TELEGRAM_BASE_URL + '/bot' + this.token + '/sendMessage', {
            method: 'POST',
            body: new URLSearchParams({
                chat_id: this.chatId,
                text: message,
            }),
        }).then(response => {
            if (response.status !== 200) return response.text().then(body => {
                throw new Error(`Error while executing sendMessage to TelegramAPI: HTTP ${response.status} - ${body}`);
            });
            return response.json();
        }).then(response => {
            if (!response.ok) throw new Error(`Error while executing sendMessage to TelegramAPI: ${JSON.stringify(response)}`);
            return response;
        });
    }

}

module.exports = NotifierService;

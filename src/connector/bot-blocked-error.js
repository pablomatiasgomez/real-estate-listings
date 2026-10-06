'use strict';

/**
 * Thrown when a loaded page is an anti-bot interstitial (captcha, challenge, verification page, etc.) instead of the real content.
 */
class BotBlockedError extends Error {

    /**
     * @param blockReason short description of the block, e.g. "AWS WAF captcha"
     * @param url the url that was being loaded
     */
    constructor(blockReason, url) {
        super(`Bot blocked: ${blockReason} while loading ${url}`);
        this.name = "BotBlockedError";
        this.blockReason = blockReason;
    }
}

// ---------

module.exports = BotBlockedError;

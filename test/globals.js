'use strict';

// globals
global.__project_dir = __dirname + '/..';
global.newLogger = className => require('../src/utils/logger.js').newLogger(className);
global.config = Object.assign(require('../src/config.js'), {});

global.config.browser.timeBetweenPageFetchesMs = 0;

var proxyquire = require('proxyquire');
module.exports = proxyquire('fs-extra', { 'ncp': require('graceful-ncp') });
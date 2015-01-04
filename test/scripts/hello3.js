#!/usr/bin/nscript
/**
 * The nscript function hellow can be invoked on many ways:
 * 1. by running this script from the shell with a global nscript: `./hello3.js`
 * 2. by running this script from the shell using node and the local nscript module: `node hello3.js`
 * 3. by requiring this script from another script and ivnoking the `run` method: require('./hello3.js').run();
 */

var helloWorld = module.exports = function(shell) {
	shell.run('echo', 'hello', 'world');
}

helloWorld.run = function() {
	require('nscript')(helloWorld);
}

if (require.main === module)
	helloWorld.run();
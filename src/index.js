#!/usr/bin/env node
/*
 * jsDo: javascript shell scripts for the masses
 *
 * (c) 2014 - Michel Weststrate
 */
/* GLOBAL exports,module */

var Fiber = require('fibers');
var shell = require('./shell.js');
var repl = require('./repl.js');
var path = require('path');
var utils = require('./utils.js');


/**
 * Runs a function using jsDo. Params will be wrapped @see jsDo.wrap based on their name, except for the first one, which will be replaced by jsdo itself.
 * @param  {function} func
 */
var runJsdoFunction = module.exports = function(func) {
	//parse and args

	if (typeof func !== "function")
		throw "Not a function: " + func + ", the script file should be in the form 'module.exports = function(shell) { }'";
	var args = utils.extractFunctionArgumentNames(func);
	args.map(shell.wrap);
	args[0] = shell;
	//invoke
	new Fiber(function() {
		func.apply(null, args);
		if (shell.verbose())
			console.log("Finished in " + process.uptime() + " seconds");
	}).run();
}

/**
 * Runs a file that contains a Jsdo script
 * @param  {string} scriptFile
 */
var runScriptFile = function(scriptFile)  {
	runJsdoFunction(require(path.resolve(process.cwd(), scriptFile))); //jsdo scripts should always export a single function that is the main
};

if (!module.parent) {
	if (process.argv.length > 2) {
		var scripts = process.argv.slice(2);
		for (var i = 0; i < scripts.length; i++)
			runScriptFile(scripts[i]); //TODO: add callback and make async, runScript cannot be run parallel
	}
	else {
		shell.useGlobals();
		repl.start();
	}
}
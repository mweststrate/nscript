#!/bin/env node
/*
 * jsDo: javascript shell scripts for the masses
 *
 * (c) 2014 - Michel Weststrate
 */
/* GLOBAL exports,module */

/*
 *
 * Imports
 *
 */
var child_process = require('child_process');
var Fiber = require('fibers');
var Future = require('fibers/future');

/*
 *
 * Flags
 *
 */
var failFast = false;
var verbose = false;
var silent = false;

/**
 * Given a function, returns an array of the (formal) parameter names. For example
 * `extractFunctionArgumentNames(function(a,b){}) == ['a','b']`
 *
 * @param  {Function} fn The function to reflect on
 * @return {Array}      Array of strings with the parameter names
 */
function extractFunctionArgumentNames(fn) {
	//http://stackoverflow.com/a/14660057
	return fn.toString()
		.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
		.match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
		.split(/,/);
}

/**
 * Runs a function using jsdo. Params will be wrapped @see jsdo.wrap based on their name, except for the first one, which will be replaced by jsdo itself.
 * @param  {function} func
 */
function runJsdoFunction(func) {
	//parse and args
	var args = extractFunctionArgumentNames(func);
	args.map(jsdo.wrap);
	args[0] = jsdo;
	//invoke
	func.apply(null, args);
}

/**
 * Function that executes a command using Jsdo (@see jsdo.exec, but also a struct that contains all the defined Jsdo commands.
 *
 * @return {Mixed Function/Object}
 */
var jsdo = exports = function() {
	return jsdo.exec.apply(null, arguments);
};

/**
 * Creates shorthand functions for invoking a command using @see jsdo.run. For example:
 * `jsdo.exec("ls","-a")`
 * can be written as
 *
 * ```
 * var ls = jsdo.wrap("ls")
 * ls("-a")
 * ```
 *
 * Multiple arguments can be bound, for example: `var pull = jsdo.wrap("git","pull");`
 *
 * @param  {string} commandName [description]
 * @return {function}             [description]
 */
jsdo.wrap = function(commandName, args) {
	var baseArgs = arguments;
	return function() {
		return jsdo.run.apply(null, Array.prototype.concat.call(baseArgs, arguments));
	};
};

/**
 * Runs a file that contains a Jsdo script
 * @param  {string} scriptFile
 */
jsdo.runScript = function(scriptFile)  {
	runJsdoFunction(require(scriptFile)); //jsdo scripts should always export a single function that is the main
};


jsdo.run = function() {
	spawn("find", ["/home/michel/Dropbox","*.txt"]);
	console.log("DONE");
};


function spawn(command, args, instream, onOut, onErr) {
	var future = new Future();
	var child = child_process.spawn(command, args, {
		//TODO: cwd: getCwd()
		stdio : 'inherit'
	});
	child.on('close', function(code) {
		future.return(code);
	});
	return future.wait();
};

/*
if (!module.parent) {
	if (process.argv.length > 2)
		jsdo.runScript();
	else
		runJsdoFunction(new Function("jsdo", readInputStream));
}
*/
Fiber(function() {
	console.log("got: " + jsdo.run("read").out);
}).run();
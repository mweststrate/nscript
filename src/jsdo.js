#!/bin/env node
/*
 * jsDo: javascript shell scripts for the masses
 *
 * (c) 2014 - Michel Weststrate
 */
/* GLOBAL exports,module */

/*
 * Imports
 */
var child_process = require('child_process');
var readline = require('readline');
var Fiber = require('fibers');
var Future = require('fibers/future');
var command = require('./command.js');

/*
 * State
 */
var verbose = false;
var silent = false;

var jsDo = exports = function() {
	return jsDo.run.apply(null, arguments);
};
jsDo.pid = process.pid;
var startDir = process.cwd();

/**
 * Make sure shorthand functions are available, so that for example this can be run:
 * jsDo.get("ls");
 */
var emptyCommand = command();
for(var key in emptyCommand) if (emptyCommand.hasOwnProperty(key))
	jsDo[key] = emptyCommand[key];

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
 * Runs a function using jsDo. Params will be wrapped @see jsDo.wrap based on their name, except for the first one, which will be replaced by jsdo itself.
 * @param  {function} func
 */
function runJsdoFunction(func) {
	//parse and args
	var args = extractFunctionArgumentNames(func);
	args.map(jsDo.wrap);
	args[0] = jsdo;
	//invoke
	func.apply(null, args);
}

/**
 * Runs a file that contains a Jsdo script
 * @param  {string} scriptFile
 */
jsDo.runScriptFile = function(scriptFile)  {
	runJsdoFunction(require(scriptFile)); //jsdo scripts should always export a single function that is the main
};

/**
 * Creates shorthand functions for invoking a command using @see jsDo.run. For example:
 * `jsDo.exec("ls","-a")`
 * can be written as
 *
 * ```
 * var ls = jsDo.wrap("ls")
 * ls("-a")
 * ```
 *
 * Multiple arguments can be bound, for example: `var pull = jsDo.wrap("git","pull");`
 *
 * @param  {string} commandName [description]
 * @return {function}             [description]
 */
jsDo.wrap = function() {
	return command.apply(null, arguments);
};

jsDo.run = function() {
	return emptyCommand.apply(null, arguments);
};

jsDo.exit = function(status) {
	if (jsDo.verbose())
		console.log("> Exiting with status: " + status);
	process.exit(status);
};

jsDo.prompt = function(prompt) {
	var future = new Future();
	var rl = readline.createInterface(process.stdin, process.stdout);
	rl.setPrompt(prompt);
	rl.prompt();
	rl.on('line', function(line) {
		future.return(line.trim());
	});
	var line = future.wait();
	rl.close();
	return line;
};

jsDo.pid = process.pid;



/*
if (!module.parent) {
	if (process.argv.length > 2)
		jsDo.runScriptFIle(process.argv[2]);
	else
		runJsdoFunction(new Function("jsdo", readInputStream));
}
*/
Fiber(function() {
	console.log("got: " + jsDo.run("read").out);
}).run();


//chdir
//cwd
//env
//exit 
//version (node version)
//pid
//uptime
//util.isArray
//
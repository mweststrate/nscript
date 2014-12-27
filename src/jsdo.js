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
var colors = require('colors/safe');
var utils = require('./utils.js');
var toArray = utils.toArray;
/*
 * State
 */
var verbose = true;

var jsDo = module.exports = function() {
	return jsDo.run.apply(null, toArray(arguments));
};

//TODO: add functions for logging

jsDo.colors = colors; //expose colors through jsDo

//require after defining jsDo!
var command = require('./command.js');
var jsDoRepl = require('./jsdorepl.js');
var startDir = process.cwd();

/**
 * Make sure shorthand functions are available, so that for example this can be run:
 * jsDo.get("ls");
 */
//TODO: don't use singleton, its dangerous
var emptyCommand = command();
for(var key in emptyCommand) if (emptyCommand.hasOwnProperty(key))
	jsDo[key] = emptyCommand[key];

/**
 * Runs a function using jsDo. Params will be wrapped @see jsDo.wrap based on their name, except for the first one, which will be replaced by jsdo itself.
 * @param  {function} func
 */
function runJsdoFunction(func) {
	//parse and args
	var args = utils.extractFunctionArgumentNames(func);
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
		console.log(colors.bold(colors[status === 0 ? 'green':'red']("Exiting with status: " + status)));
	process.exit(status);
};

jsDo.prompt = function(prompt) {
	jsDoRepl.pause();
	try {
		var future = new Future();
		var rl;
		setImmediate(function() { //set immediate enables the Node REPL to close before the prompt
			console.log("\n");
			rl = readline.createInterface(process.stdin, process.stdout);
			rl.setPrompt("" + prompt + " ");
			rl.prompt();
			rl.on('line', function(line) {
				future.return(line.trim());
			});
		});
		var line = future.wait();
		rl.close();
		if (jsDo.verbose())
			console.log(colors.gray("User input: " + line));
		return line;
	} finally {
		jsDoRepl.resume();
	}
};

jsDo.verbose = function(newVerbose) {
	if (newVerbose === undefined)
		return verbose;
	verbose = !!newVerbose;
};

jsDo.useGlobals = function() {
	for(var key in jsDo) {
		global[key] = jsDo[key];
	}
};

jsDo.cwd = function() {
	return process.cwd();
};

jsDo.cd = function(newdir) {
	if (arguments.length === 0)
		newdir = startDir;
	newdir = newdir.replace(/~/g, function() {
		return require('home-dir').directory;
	});
	process.chdir(newdir);
	jsDoRepl.updatePrompt();
	if (jsDo.verbose())
		console.log(colors.cyan("> Entering " + jsDo.cwd()));
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
/*
Fiber(function() {
	console.log("got: " + jsDo.code("ls"));
}).run();
*/

//TODO: if started without args
jsDo.useGlobals();
jsDoRepl.start();

//chdir
//cwd
//env
//exit
//version (node version)
//pid
//uptime
//util.isArray
//
/* GLOBAL exports,module */

/*
 * Imports
 */
var path = require('path');
var Future = require('fibers/future');
var colors = require('colors/safe');
var utils = require('./utils.js');
var util = require('util');
var toArray = utils.toArray;

/*
 * State
 */
var verbose = false;

var shell = module.exports = function shell() {
	return shell.run.apply(null, toArray(arguments));
};

//TODO: add functions for logging

shell.colors = colors; //expose colors through shell

//require after defining shell!
var command = require('./command.js');
var repl = require('./repl.js');
var startDir = process.cwd();

/**
 * Make sure shorthand functions are available, so that for example this can be run:
 * shell.get("ls");
 */
//TODO: don't use singleton, its dangerous
var emptyCommand = command();
for(var key in emptyCommand) if (emptyCommand.hasOwnProperty(key))
	shell[key] = emptyCommand[key];

/**
 * Creates shorthand functions for invoking a command using @see shell.run. For example:
 * `shell.exec("ls","-a")`
 * can be written as
 *
 * ```
 * var ls = shell.wrap("ls")
 * ls("-a")
 * ```
 *
 * Multiple arguments can be bound, for example: `var pull = shell.wrap("git","pull");`
 *
 * @param  {string} commandName [description]
 * @return {function}             [description]
 */
shell.wrap = function() { //TODO: rename: alias
	return command.apply(null, arguments);
};

shell.exit = function(status) {
	if (shell.verbose())
		console.log(colors.bold(colors[status === 0 ? 'green':'red']("Exiting with status: " + status)));
	process.exit(status);
};

shell.prompt = function(prompt) {
	return repl.prompt(prompt);
};

shell.verbose = function(newVerbose) {
	if (newVerbose === undefined)
		return verbose;
	verbose = !!newVerbose;
	return this;
};

shell.useGlobals = function() {
	for(var key in shell) {
		global[key] = shell[key];
		//TODO: find all executables
	}
};

shell.cwd = function() {
	return process.cwd();
};

shell.cd = function(newdir) {
	if (arguments.length === 0)
		newdir = startDir;
	newdir = newdir.replace(/~/g, function() {
		return require('home-dir').directory;
	});
	process.chdir(newdir);
	repl.updatePrompt();
	if (shell.verbose())
		console.log(colors.cyan("> Entering " + shell.cwd()));
};

shell.pid = process.pid;

//TODO: expose env
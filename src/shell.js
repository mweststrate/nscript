/* GLOBAL exports,module */

/*
 * IMPORTS
 */
var path = require('path');
var Future = require('fibers/future');
var colors = require('colors/safe');
var utils = require('./utils.js');
var util = require('util');
var toArray = utils.toArray;

/*
 * STATE
 */
var verbose = false;

var shell = module.exports = function shell() {
	return shell.run.apply(null, toArray(arguments));
};

/*
 * LOCAL IMPORTS
 *
 * require only after defining shell!
 */
var command = require('./command.js');
var repl = require('./repl.js');
var startDir = process.cwd();

/*
 * EXPOSED VARIABLES
 *
 * Make sure shorthand functions are available, so that for example this can be run:
 * shell.get("ls");
 */
shell.pid = process.pid;
shell.env = process.env;
shell.colors = colors;
shell.nscript = require('./index.js'); //Function
shell.glob = require('glob').sync;

(function() {
	var tmpCommand = command();
	for(var key in tmpCommand) if (tmpCommand.hasOwnProperty(key) && utils.isFunction(tmpCommand[key])) {
		shell[key] = function(key) {
			return function() {
				var cmd = new command();
				return cmd[key].apply(cmd, arguments);
			}
		}(key); //capture key in inner-scope
	}
}())


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
	//special case: people might try to alias the cd command which is a shell built-in, not an executable
	if (arguments[0] == "cd") {
		var args = toArray(arguments);
		return function(dir) {
			return shell.cd(args.length ? args[0] : dir);
		};
	}
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
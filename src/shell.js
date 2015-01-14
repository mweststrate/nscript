/* GLOBAL exports,module */

/*
 * IMPORTS
 */
var path = require('path');
var fs = require('fs');
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
var spawn = require('./spawn.js');

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
shell.glob = require('glob').sync;
shell.lastExitCode = 0;

//TODO: make shell.nscript synchronous and return the exit code
//TODO: or: make shell.script do autoFiber and have callback with exit code
shell.nscript = require('./index.js'); //Function

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
 * var ls = shell.alias("ls")
 * ls("-a")
 * ```
 *
 * Multiple arguments can be bound, for example: `var pull = shell.alias("git","pull");`
 *
 * @param  {string} commandName [description]
 * @return {function}             [description]
 */
shell.alias = function() {
	//special case: people might try to alias the cd command which is a shell built-in, not an executable
	if (arguments[0] == "cd") {
		var args = toArray(arguments);
		return function(dir) {
			return shell.cd(args.length ? args[0] : dir);
		};
	}
	//TODO: check existence of command
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

shell.cwd = shell.pwd = function() {
	var dir = process.cwd();
	if (dir[dir.length -1] !== path.sep)
		return dir + path.sep;
	return dir;
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

shell.isFile = function(path) {
	try {
		return fs.statSync(spawn.expandArgument(path)).isFile();
	}
	catch (e) {
		return false;
	}
};

shell.isDir = function(path) {
	try {
		return fs.statSync(spawn.expandArgument(path)).isDirectory();
	}
	catch (e) {
		return false;
	}
};

shell.writeString = function(filename, text) {
	fs.writeFileSync(spawn.expandArgument(filename), "" + text, { encoding: 'utf8' });
};

shell.readString = function(filename) {
	return fs.readFileSync(spawn.expandArgument(filename), { encoding: 'utf8' });
};

shell.files = function(dir) {
	dir = dir ? spawn.expandArgument(dir) : ".";
	return fs.readdirSync(dir).map(function(entry) {
		return (dir == "." ? "" : dir + path.sep) + entry;
	});
};
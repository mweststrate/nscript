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
	//TODO: should be alias for cmd() instead of run() ?
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
var dirStack = [];

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
shell.future = function() {
	return new Future();
};

// FEATURE: create a Fiber automatically and support a callback function (with exit code?)
shell.nscript = require('./index.js'); //Function

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
	// special case: people might try to alias the cd command which is a shell built-in, not an executable
	// FEATURE: allow alias any build-in shell function, such as 'run', 'exit' and 'prompt'
	if (arguments[0] == "cd") {
		var args = toArray(arguments);
		return function(dir) {
			return shell.cd(args.length ? args[0] : dir);
		};
	}
	return command.apply(null, arguments);
};

shell.cmd = shell.alias;

// FEATURE: exit should only close the enclosing nscript function?
shell.exit = function(status, message) {
	if (message) {
		if (status !== 0)
			console.error(colors.bold(colors.red(message)));
		else
			console.error(message);
	}
	if (shell.verbose())
		console.warn(colors.bold(colors[status === 0 ? 'green':'red']("Exiting with status: " + status)));
	process.exit(status);
};

// FEATURE: prompt with grabchar and repeat on wrong answer:
// shell.prompt(prompt, opts, default)
// e.g. shell.prompt("Delete file? ", "yn", "y") -> 'Delete file? [Y/n]: '

shell.prompt = function(prompt, defaultValue) {
	utils.expectArgs(arguments, -1);
	return repl.prompt(prompt, defaultValue);
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
		console.warn(colors.cyan("> Entering " + shell.cwd()));
};

shell.popd = function() {
	if (!dirStack.length) {
		console.warn(colors.red("[shell.popd] dir stack is empty. Ignoring"));
		return;
	}
	var dir = dirStack.pop();
	shell.cd(dir);
}

shell.pushd = function(newdir) {
	dirStack.push(shell.pwd());
	shell.cd(newdir);
}

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

shell.write = function(filename, text) {
	utils.expectArgs(arguments, 2);
	return fs.writeFileSync(spawn.expandArgument(filename), "" + text, { encoding: 'utf8' });
};

shell.append = function(filename, text) {
	utils.expectArgs(arguments, 2);
	return fs.appendFileSync(spawn.expandArgument(filename), "" + text, { encoding: 'utf8' });
};

shell.read = function(filename) {
	utils.expectArgs(arguments, 1);
	return fs.readFileSync(spawn.expandArgument(filename), { encoding: 'utf8' });
};

shell.files = function(dir) {
	dir = dir ? spawn.expandArgument(dir) : ".";
	return fs.readdirSync(dir).map(function(entry) {
		return (dir == "." ? "" : dir + path.sep) + entry;
	});
};

/*
	Wrapped commands
 */

shell.run = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().run.apply(null, arguments);
};

shell.code = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().code.apply(null, arguments);
};

shell.test = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().test.apply(null, arguments);
};

shell.get = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().get.apply(null, arguments);
};

shell.getError = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().getError.apply(null, arguments);
};

shell.getLines = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().getLines.apply(null, arguments);
};

shell.detach = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().detach.apply(null, arguments);
};

shell.spawn = function() {
	utils.expectArgs(arguments, -1);
	return shell.cmd().argsSplat(toArray(arguments)).spawn();
};

/**
 * FEATURE: make file like conditional builds
 * shell.build.Compile[Async](globPattern, transformFunction(files, callback?))
 * shell.build.Transform[Async](globPattern, transformFunction(file, callback?))
 * shell.build.Watch();
 * shell.build.isModified()
 * shell.build.resetModifiedCache()
 * shell.build.markUnmodified
 * shell.lastModified(filename)
 * shell.md5(filename)
 */


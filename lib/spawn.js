/*
 * Imports
 */
var fs = require('fs');
var path = require('path');
var shell = require('./shell.js');
var repl = require('./repl.js');
var child_process = require('child_process');
var Fiber = require('fibers');
var Future = require('fibers/future');
var utils = require('./utils.js');
var extend = utils.extend;
//TODO: replace util imports with utils
var util = require('util');
var homedir = require('home-dir').directory;
var glob = require('glob');

/*
 * State
 */
var nextInputStream = null;
var globOptions = {nocomment:true}; //see: https://github.com/isaacs/node-glob/issues/152

var expandArgument = exports.expandArgument = function(arg, applyGlobbing) {
	//TODO: process args: bound cmd function, glob, home, quote, literal, map
	if (arg === null || arg === undefined || typeof arg === "function")
		throw new Error("Spawn argument should not be null or undefined or an function");
	if (util.isArray(arg))
		return arg;
	if (typeof arg === "object") {
		//translates { "--no-ff" :true, "--squash":false, "-m":"hi"} to ["--no-ff","-m","hi"]
		var res = [];
		for (var key in arg) {
			if (arg[key] !== false) {
				res.push(utils.hyphenate(key));
				if (arg[key] !== true)
					res.push(expandArgument(arg[key], applyGlobbing));
			}
		}
		return res;
	}
	arg = "" + arg; //cast to string
	arg = arg.trim().replace(/^~/, homedir);
	if (applyGlobbing && glob.hasMagic(arg, globOptions))
		return glob.sync(arg, globOptions);
	else
		return arg;
};

var expandArguments = exports.expandArguments = function(args) {
	return utils.flatten(args.map(function(arg) {
		return expandArgument(arg, true);
	}));
};

fixLocalScript = function(scriptName) {
	if (scriptName.indexOf(path.sep) !== -1) // there is a folder name, or the script name is already relative, absolute or related to home
		return scriptName;
	if (shell.isFile(scriptName))
		return "./" + scriptName;
	return scriptName;
};

/*
 * Methods
 */
exports.spawn = function(commandAndArgs, opts) {
	//TODO: do not require local scripts to be prefixed with './'
	var stdio;
	function closeStdios() {
		stdio.forEach(function(stream) {
			if (typeof stream === "number" && stream > 2)
				fs.closeSync(stream); //Close all file descriptors that are files
		});
	}

	opts = extend({
		detached : false,
		stdin : undefined,
	}, opts);

	//expand the arguments before spawning, the first argument is treated differently
	var executable = fixLocalScript(expandArgument(commandAndArgs.shift(), false));
	if (!executable)
		throw new Error("Not a valid executable: '" + executable + "'");
	commandAndArgs = expandArguments(commandAndArgs);
	commandAndArgs.unshift(executable);
	if (!commandAndArgs.length)
		throw new Error("Spawn received empty command. Please specify a command and arguments");

	var command = commandAndArgs.join(" ");
	if (!opts.detached)
		repl.pause();
	var cmd = commandAndArgs.shift();

	if (shell.verbose())
		console.log(shell.colors.cyan("Starting: " + command));

	var child = child_process.spawn(cmd, commandAndArgs, {
		cwd: shell.cwd(),
		detached: opts.detached,
		stdio : stdio = [
			opts.stdin ? (typeof opts.stdin == "number" ? opts.stdin : 'pipe') : 0,
			'pipe',
			'pipe'
		]
	});
	if (opts.stdin && typeof opts.stdin != "number")
		opts.stdin.pipe(child.stdin, { end: true });

	child.on('error', function(err) {
		if (shell.verbose())
			console.error(shell.colors.red("Failed to start '" + command + "': " + err));
	});
	child.on('close', function(code) {
		closeStdios();
		if (code >= 0 && shell.verbose())
			console.log(shell.colors.bold(shell.colors[code === 0 ? 'green' : 'red']("[-] Done: '" + command + "': " + code)));
		if (!opts.detached)
			repl.resume();
	});
	return child;
};
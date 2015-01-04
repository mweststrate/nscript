/*
 * Imports
 */
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
var lastCommand = "";

var expandArgument = exports.expandArgument = function(arg) {
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
					res.push(arg[key]); //TODO: expand value!
			}
		}
		return res;
	}
	arg = "" + arg; //cast to string
	arg = arg.trim().replace(/^~/, homedir);
	if (glob.hasMagic(arg))
		return glob.sync(arg);
	else
		return arg;
};

var expandArguments = exports.expandArguments = function(args) {
	return utils.flatten(args.map(expandArgument));
};

/*
 * Methods
 */
exports.spawn = function(commandAndArgs, opts) {
	opts = extend({
		blocking : true,
		detached : false,
		throwOnError : true,
		silent : false,
		onOut : null,
		onError : null,
		stdin : null,
		stdout: null,
		stderr : null
	}, opts);
	if (opts.detached && opts.blocking)
		throw "detached and blocking cannot be combined!";
	if (opts.onOut && opts.stdout)
		throw "onOut and stdout cannot be combined!";
	if (opts.onError && opts.stderr)
		throw "onError and stderr cannot be combined!";

	commandAndArgs = expandArguments(commandAndArgs);
	var command = lastCommand = commandAndArgs.join(" ");
	if (!opts.detached)
		repl.pause();
	var future = opts.blocking ? new Future() : null;
	var cmd = commandAndArgs.shift();

	if (shell.verbose())
		console.log(shell.colors.cyan("Starting: " + command));

	var child = child_process.spawn(cmd, commandAndArgs, {
		cwd: shell.cwd(),
		detached: opts.detached,
		stdio : [
			opts.stdin ? (typeof opts.stdin == "number" ? opts.stdin : 'pipe') : 0,
			opts.onOut ? 'pipe' : (opts.stdout ? opts.stdout : (opts.silent ? 'ignore' : 1)),
			opts.onError ? 'pipe' : (opts.stderr ? opts.stderr : (opts.silent ? 'ignore' : 2))
		]
	});
	if (opts.stdin && typeof opts.stdin != "number") {
		opts.stdin.pipe(child.stdin);
	}
	if (opts.onOut)
		child.stdout.on('data', opts.onOut);
	if (opts.onError)
		child.stderr.on('data', opts.onError);
	child.on('error', function(err) {
		console.error(shell.colors.red("Failed to spawn '" + command + "': " + err));
	});
	child.on('close', function(code) {
		if (code < 0)
			console.log(shell.colors.bold(shell.colors.red("Failed to start the child process: " + code)));
		else if (shell.verbose())
			console.log(shell.colors.bold(shell.colors[code === 0 ? 'green' : 'red']("Finished with exit code: " + code)));
		if (!opts.detached)
			repl.resume();
		if (opts.blocking) {
			//TODO: update lastExitCode
			future.return(code);
		}
	});

	if (opts.blocking) {
		var status = future.wait();
		if (opts.throwOnError) {
			if (status !== 0)
				throw "Command '" + command + "' failed with status: " + status;
			return undefined; //apparently, nobody cares..
		}
		return status;
	}
	else
		return child;
};
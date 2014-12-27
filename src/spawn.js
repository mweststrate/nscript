/*
 * Imports
 */
var jsDo = require('./jsdo.js');
var jsDoRepl = require('./jsdorepl.js');
var child_process = require('child_process');
var Fiber = require('fibers');
var Future = require('fibers/future');
var extend = require('./utils.js').extend;

/*
 * State
 */
var nextInputStream = null;
var lastCommand = "";

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

	lastCommand = commandAndArgs.join(" ");
	if (!opts.detached)
		jsDoRepl.pause();
	var future = opts.blocking ? new Future() : null;
	var cmd = commandAndArgs.shift();

	if (jsDo.verbose())
		console.log(jsDo.colors.cyan("Starting: " + lastCommand));

	var child = child_process.spawn(cmd, commandAndArgs, {
		cwd: jsDo.cwd(),
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
		console.error(jsDo.colors.red("Failed to spawn '" + lastCommand + "': " + err));
	});
	child.on('close', function(code) {
		if (code < 0)
			console.log(jsDo.colors.bold(jsDo.colors.red("Failed to start the child process: " + code)));
		else if (jsDo.verbose())
			console.log(jsDo.colors.bold(jsDo.colors[code === 0 ? 'green' : 'red']("Finished with exit code: " + code)));
		if (!opts.detached)
			jsDoRepl.resume();
		if (opts.blocking)
			future.return(code);
	});

	if (opts.blocking) {
		var status = future.wait();
		if (status && opts.throwOnError)
			throw new Error("Command '" + lastCommand + "' failed with status: " + status);
		return status;
	}
	else
		return child;
};
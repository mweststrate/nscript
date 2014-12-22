/*
 * Imports
 */
var jsDo = require('./jsdo.js');
var jsDoRepl = require('./jsdorepl.js');
var child_process = require('child_process');
var Fiber = require('fibers');
var Future = require('fibers/future');


/*
 * State
 */
var nextInputStream = null;
var lastCommand = "";

/*
 * Methods
 */
function getNextInputStream() {
	var n = nextInputStream;
	nextInputStream = null;
	return !n ? 'pipe' : n;
}

exports.setNextInputStream = function(stream) {
	if (nextInputStream)
		throw new Error("IllegalStateException: InputStream for next invocation is already set");
	nextInputStream = stream;
};

exports.spawn = function(commandAndArgs, onOut, onErr, throwOnError, blocking) {
	blocking = blocking !== false;
	throwOnError = throwOnError !== false;
	lastCommand = commandAndArgs.join(" ");
	jsDoRepl.pause();
	var future = blocking ? new Future() : null;
	var cmd = commandAndArgs.shift();

	if (jsDo.verbose())
		console.log(jsDo.colors.gray("Starting: " + lastCommand));

	var child = child_process.spawn(cmd, commandAndArgs, {
		cwd: jsDo.cwd(),
		stdio : [
			getNextInputStream(),
			onOut ? null : jsDo.silent() ? 'ignore' : 1, //null creates a new pipe
			onErr ? null : jsDo.silent() ? 'ignore' : 2
		]
	});
	if (onOut)
		child.stdout.on('data', onOut);
	if (onErr)
		child.stderr.on('data', onErr);
	child.on('close', function(code) {
		jsDoRepl.resume();
		if (blocking)
			future.return(code);
	});

	if (blocking) {
		var status = future.wait();
		if (jsDo.verbose())
			console.log(jsDo.colors.bold(jsDo.colors[status === 0 ? 'green' : 'red']("Finished with exit code: " + status)));
		if (status && throwOnError)
			throw new Error("Command '" + lastCommand + "' failed with status: " + status);
		return status;
	}
	else
		return child;
};
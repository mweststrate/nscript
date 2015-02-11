var shell = require('./shell.js');
var spawn = require('./spawn.js');
var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var stream = require('stream');
var toArray = require('./utils.js').toArray;
var utils = require('./utils.js');
var extend = utils.extend;
var Future = require('fibers/future');

var command = module.exports = function() {
	/*
		Basic command structure
	 */
	// TODO: commands should be stateless and make defensive copies, to avoid mangling the internal state of aliases.
	var baseArgs = toArray(arguments);
	var nextOptions = {};

	var cmd = function(/* args */) {
		return cmd.spawn.apply(null, arguments).wait();
	};

	cmd.boundArgs = baseArgs;
	cmd.run = cmd; //e.g. silent()('ls') === silent().run('ls');

	/*
		Options and convenience methods
	 */
	cmd.silent = function() {
		utils.expectArgs(arguments, 0);
		nextOptions.silent = true;
		return cmd;
	};

	cmd.relax = function() {
		utils.expectArgs(arguments, 0);
		nextOptions.throwOnError = false;
		return cmd;
	};

	cmd.env = function(key, value) {
		nextOptions.env = nextOptions.env || {};
		if (arguments.length == 2)
			nextOptions.env[key] = value;
		else
			utils.extend(nextOptions.env, key);
		return cmd;
	};

	cmd.code = function(/* args */) {
		return cmd.spawn.apply(null, arguments).code();
	};

	cmd.test = function(/* args */) {
		return cmd.spawn.apply(null, arguments).test();
	};

	cmd.get = function(/* args */) {
		return cmd.spawn.apply(null, arguments).get();
	};

	cmd.getError = function(/* args */) {
		return cmd.spawn.apply(null, arguments).getError();
	};

	cmd.getLines = function(/* args */) {
		return cmd.get.apply(null, arguments).getLines();
	};

	/*
		Process input handling
	 */
	cmd.input = function(input) {
		utils.expectArgs(arguments, 1);
		if (nextOptions.stdin)
			throw new Error("Input for the next process invocation has been set already!");
		if (typeof(input) == "number" || (input && input.pipe)) {
			nextOptions.stdin = input;
		}
		// FEATURE: if function, evaluate lazy on each read, so that 'yes' script
		else { //string or buffer
			// http://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream#16039177
			var bufferStream = new stream.Readable();
			bufferStream._read = function () {
				this.push('' + input);
				this.push(null);
			};
			nextOptions.stdin = bufferStream;
		}
		return cmd;
	};

	cmd.read = function(filename) {
		utils.expectArgs(arguments, 1);
		if (nextOptions.stdin)
			throw new Error("Input for the next process invocation has been set already!");
		filename = spawn.expandArgument(filename, false);
		if (shell.verbose())
			console.warn('< ' + filename);
		nextOptions.stdin = fs.openSync(filename, 'r');
		return cmd;
	};

	/*
		Process output handling
	 */

	cmd.pipe = function(/* args */) {
		utils.expectArgs(arguments, -1);
		return cmd.spawn().pipe.apply(null, arguments);
	};

	cmd.write = function(filename) {
		utils.expectArgs(arguments, 1);
		// returns exit code
		return cmd.spawn().write(filename).wait();
	};

	cmd.append = function(filename) {
		utils.expectArgs(arguments, 1);
		// returns exit code
		return cmd.spawn().append(filename).wait();
	};

	cmd.writeError = function(filename) {
		utils.expectArgs(arguments, 1);
		// returns streams for convenient chaining
		return cmd.spawn().writeError(filename);
	};

	cmd.appendError = function(filename) {
		utils.expectArgs(arguments, 1);
		// returns streams for convenient chaining
		return cmd.spawn().appendError(filename);
	};

	// TODO: spawn should not take arguments, introduce args() instead.
	cmd.spawn = function(/*args*/) {
		var streamsConsumed = [null, false, false];
		var self = {};
		var options = extend({
			throwOnError: true,
			silent: false
		}, nextOptions);
		nextOptions = {};

		var commandAndArgs = baseArgs.concat(toArray(arguments));
		var child = spawn.spawn(commandAndArgs, options);
		process.nextTick(function() {
			//make sure the output streams go somewhere
			for(var i = 1; i < 3; i++) if (!streamsConsumed[i]) {
				if (options.silent)
					child.stdio[i].resume();
				else {
					child.stdio[i].pipe(i == 1 ? process.stdout : process.stderr);
				}
			}
		});

		function outputToFile(streamIdx, flags, filename) {
			utils.expectArgs(arguments, 3);
			streamsConsumed[streamIdx] = true;
			if (shell.verbose())
				console.warn((streamIdx == 2 ? '2' : '') + (flags == 'w' ? '>' : '>>') + ' ' + filename);
			var out = fs.createWriteStream(filename,  {flags: flags});
			child.stdio[streamIdx].pipe(out);
			return self;
		}

		function pipeHelper(streamIdx, cmd) {
			utils.expectArgs(arguments, -1);
			streamsConsumed[streamIdx] = true;
			if (!cmd.boundArgs)
				cmd = command(cmd);
			// Set the input of the target command to the output of this command
			// And start the command, and return the streams
			return cmd.input(child.stdio[streamIdx]).spawn.apply(cmd, toArray(arguments).splice(2));
		}

		function getHelper(streamIdx) {
			utils.expectArgs(arguments, 1);
			options.silent = true;
			var buf = "";
			child.stdio[streamIdx].on('data', function(d) {
				buf += d;
			});
			self.wait();
			return buf;
		}

		return extend(self, {
			pid : child.pid,
			process : child,
			get: getHelper.bind(self, 1),
			getError: getHelper.bind(self, 2),
			getLines: function() {
				return getHelper(1).split(/\r?\n/g);
			},
			pipe: pipeHelper.bind(self, 1),
			pipeError: pipeHelper.bind(self, 2),
			write: outputToFile.bind(self, 1,'w'),
			append: outputToFile.bind(self, 1,'a'),
			writeError: outputToFile.bind(self, 2,'w'),
			appendError: outputToFile.bind(self, 2,'a'),
			wait: function() {
				utils.expectArgs(arguments, 0);
				var future = new Future();
				var spawnError;

				child.on('error', function(err) {
					spawnError = err;
				});
				child.on('close', function(exitCode) {
					future.return(exitCode);
				});
				var status = shell.lastExitCode = future.wait();
				if (options.throwOnError) {
					if (status > 0)
						throw utils.buildError('NonZeroExitError', "Command '" + commandAndArgs.join(" ") + "' failed with status: " + status);
					else if (status < 0)
						throw utils.buildError('FailedToStartError', "Command '" + commandAndArgs.join(" ") + "' failed to start, got: '" + spawnError.message + "'. \nDoes '" + commandAndArgs[0] + "' exist (in the current dir or on PATH), is it readable and marked as executable?");
				}
				return status;
			},
			test: function() { return self.code() === 0; },
			code: function() {
				options.throwOnError = false;
				return self.wait();
			},
			onClose: function(cb) {
				utils.expectArgs(arguments, 1);
				child.on('close', cb);
			},
			onOut: function(cb) { // TODO: rename to onData & onErrorData?
				utils.expectArgs(arguments, 1);
				child.stdout.on('data', cb);
			},
			// FEATURE: onLine, like onOut, but for each line
			onError: function(cb) {
				utils.expectArgs(arguments, 1);
				child.stderr.on('data', cb);
			},
			toString: function() {
				return "[Process '" + args + "']";
			}
		});
	};

	cmd.detach = function(/* args */) {
		nextOptions.detached = true;
		var child = cmd.spawn.apply(null, arguments).process;
		child.unref(); //do not wait for child to exit
		console.warn("[+] " + child.pid);
		return child.pid;
	};

	cmd.toString = function() {
		return "[Command " + this.boundArgs.join(" ") + "]";
	};

	//FEATURE: cmd.background: run stuff in background, but kill it when the process exits
	return cmd;
};
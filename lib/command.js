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

	var cmd = function run(/* args */) {
		return cmd.argsSplat(arguments).spawn().wait();
	};

	// TODO: remove bound args?
	cmd._args = cmd.boundArgs = toArray(arguments);
	cmd._options = {
		throwOnError: true,
		silent: false
	};

	cmd.options = function(newOptions) {
		var clone = cmd.clone();
		extend(clone._options, newOptions);
		return clone;
	};

	cmd.args = function(/* args */) {
		var clone = cmd.clone();
		clone._args = clone._args.concat(toArray(arguments));
		return clone;
	};

	cmd.argsSplat = function(args) {
		return cmd.args.apply(null, toArray(args));
	};

	cmd.clone = function() {
		var clone = command();
		clone._args = [].concat(cmd._args);
		clone._options = extend({}, cmd._options);
		return clone;
	};

	cmd.run = cmd; //e.g. silent()('ls') === silent().run('ls');

	/*
		Options and convenience methods
	 */
	cmd.silent = function() {
		utils.expectArgs(arguments, 0);
		return cmd.options({silent: true});
	};

	cmd.relax = function() {
		utils.expectArgs(arguments, 0);
		return cmd.options({throwOnError: false});
	};

	cmd.env = function(key, value) {
		var newEnv = cmd._options.env || {};
		if (arguments.length == 2)
			newEnv[key] = value;
		else
			utils.extend(newEnv, /*object*/ key);
		return cmd.options({env: newEnv});
	};

	cmd.code = function(/* args */) {
		return cmd.argsSplat(arguments).spawn().code();
	};

	cmd.test = function(/* args */) {
		return cmd.argsSplat(arguments).spawn().test();
	};

	cmd.get = function(/* args */) {
		return cmd.argsSplat(arguments).spawn().get();
	};

	cmd.getError = function(/* args */) {
		return cmd.argsSplat(arguments).spawn().getError();
	};

	cmd.getLines = function(/* args */) {
		return cmd.argsSplat(arguments).spawn().getLines();
	};

	/*
		Process input handling
	 */
	cmd.input = function(input) {
		utils.expectArgs(arguments, 1);
		if (cmd._options.stdin)
			throw new Error("Input for the next process invocation has been set already!");
		if (typeof(input) == "number" || (input && input.pipe))
			return cmd.options({stdin: input});

		// FEATURE: if function, evaluate lazy on each read, so that 'yes' script
		// http://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream#16039177
		var bufferStream = new stream.Readable();
		bufferStream._read = function () {
			this.push('' + input);
			this.push(null);
		};
		return cmd.options({stdin: bufferStream});
	};

	cmd.read = function(filename) {
		utils.expectArgs(arguments, 1);
		if (cmd._options.stdin)
			throw new Error("Input for the next process invocation has been set already!");
		filename = spawn.expandArgument(filename, false);
		if (shell.verbose())
			console.warn('< ' + filename);
		return cmd.options({stdin: fs.openSync(filename, 'r')});
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

	cmd.spawn = function() {
		// TODO: remove args param
		var streamsConsumed = [null, false, false];
		var options = extend({}, cmd._options); //clone
		var self = {};

		var commandAndArgs = cmd._args;
		var child = spawn.spawn(commandAndArgs, options);
		process.nextTick(function() {
			//make sure the output streams go somewhere
			for(var i = 1; i < 3; i++) if (!streamsConsumed[i]) {
				if (cmd._options.silent)
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
			return cmd.input(child.stdio[streamIdx]).argsSplat(toArray(arguments).splice(2)).spawn();
		}

		function getHelper(streamIdx) {
			utils.expectArgs(arguments, 1);
			streamsConsumed[streamIdx] = true;
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
		var child = cmd.options({detached: true}).argsSplat(arguments).spawn().process;
		child.unref(); //do not wait for child to exit
		console.warn("[+] " + child.pid);
		return child.pid;
	};

	cmd.toString = function() {
		return "[Command " + cmd._args.join(" ") + "]";
	};

	//FEATURE: cmd.background: run stuff in background, but kill it when the process exits
	return cmd;
};
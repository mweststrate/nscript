var shell = require('./shell.js');
var spawn = require('./spawn.js');
var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var stream = require('stream');
var toArray = require('./utils.js').toArray;
var extend = require('./utils.js').extend;
var Future = require('fibers/future');

var command = module.exports = function() {
	var baseArgs = toArray(arguments);
	var nextOptions = {};

	function spawnHelper(args, options) {
		var opts = extend(nextOptions, options);
		nextOptions = {};
		return spawn.spawn(baseArgs.concat(args), opts);
	}

	var cmd = function() {
		return spawnHelper(toArray(arguments));
	};

	cmd.boundArgs = baseArgs;
	cmd.run = cmd; //e.g. silent()('ls') === silent().run('ls');

	cmd.silent = function() {
		nextOptions.silent = true;
		return cmd;
	};

	cmd.relax = function() {
		nextOptions.throwOnError = false;
		return cmd;
	};

	cmd.get = function() {
		var buffer = "";
		spawnHelper(toArray(arguments), {
			onOut : function(data) {
				buffer += data.toString();
			}
		});
		return buffer;
	};

	cmd.getError = function() {
		var buffer = "";
		spawnHelper(toArray(arguments), {
			onError : function(data) {
				buffer += data.toString();
			}
		});
		return buffer;
	};
	//TODO: getLines, getAll

	cmd.stream = function() {
		var streamsConsumed = [null, false, false];

		var child = spawn.spawn(baseArgs.concat(toArray(arguments)), extend(nextOptions, {
			stdout: 'pipe',
			stderr: 'pipe',
			blocking: false,
		}));

		nextOptions = {};
		setImmediate(function() {
			//make sure the streams go somewhere
			for(var i = 1; i < 3; i++) if (!streamsConsumed[i])
				child.stdio[i].pipe(i == 1 ? process.stdout : process.stderr);
		});

		function outputToFile(streamIdx, flags, filename) {
			streamsConsumed[streamIdx] = true;
			if (shell.verbose())
				console.log((flags == 'w' ? '>' : '>>') + ' ' + filename);
			var out = fs.createWriteStream(filename,  {flags: flags});
			child.stdio[streamIdx].pipe(out);
			return this;
		}

		function pipeHelper(streamIdx, cmd) {
			streamsConsumed[streamIdx] = true;
			if (cmd.boundArgs)
				return cmd.read(child.stdio[streamIdx]);
			return command.apply(null, toArray(arguments).splice(1)).read(child.stdio[streamIdx]);
		}

		var outputStreams = {};
		return extend(outputStreams, {
			pipe: pipeHelper.bind(outputStreams, 1),
			pipeError: pipeHelper.bind(outputStreams, 2),
			writeTo: outputToFile.bind(outputStreams, 1,'w'),
			appendTo: outputToFile.bind(outputStreams, 1,'a'),
			writeErrorTo: outputToFile.bind(outputStreams, 2,'w'),
			appendErrorTo: outputToFile.bind(outputStreams, 2,'a'),
			wait: function() {
				//TODO: check no args
				var future = new Future();
				this.onClose(function(exitCode) {
					future.return(exitCode);
				});
				return future.wait();
			},
			test: function() { return this.wait() === 0; },
			code: function() { return this.wait(); },
			onClose: function(cb) {
				child.on('close', cb);
			},
			toString: function() {
				return "[OutputStreams of " + args + "]";
			}
		});
	};

	cmd.read = function(input) {
		//TODO: check stdin not setyet
		if (typeof(input) == "number" || (input && input.pipe)) {
			nextOptions.stdin = input;
		}
		else { //string or buffer
			// http://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream#16039177
			var bufferStream = new stream.Readable();
			bufferStream._read = function () {
				this.push('' + input + '\n'); //TODO: append newline, for usage with cat for example?
				this.push(null);
			};
			nextOptions.stdin = bufferStream;
		}
		return cmd;
	};

	cmd.readFrom = function(filename) {
		//TODO: check stdin not setyet
		filename = spawn.expandArgument(filename, false);
		if (shell.verbose())
			console.log('< ' + filename);
		nextOptions.stdin = fs.openSync(filename, 'r');
		return cmd;
	};

	cmd.code = function() {
		return spawnHelper(toArray(arguments), {
			throwOnError : false
		});
	};

	cmd.test = function() {
		return cmd.code.apply(this, arguments) === 0;
	};


	cmd.detach = function() {
		var child = spawnHelper(toArray(arguments), {
			blocking: false,
			throwOnError: false,
			detached: true
		});
		child.unref(); //do not wait for child to exit
		console.log("[+] " + child.pid);
		return child.pid;
	};

	//FEATURE: cmd.background: run stuff in background, but kill it when the process exits
	return cmd;
};
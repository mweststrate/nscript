var shell = require('./shell.js');
var spawn = require('./spawn.js');
var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var stream = require('stream');
var toArray = require('./utils.js').toArray;
var extend = require('./utils.js').extend;

var command = module.exports = function() {
	var baseArgs = toArray(arguments);
	var nextOptions = {};

	function spawnHelper(args, options) {
		var opts = extend(nextOptions, options);
		nextOptions = {};
		return spawn.spawn(baseArgs.concat(args), opts);
	}

	//TODO: rename runner to command
	var runner = function() {
		return spawnHelper(toArray(arguments));
	};

	runner.run = runner; //e.g. silent()('ls') === silent().run('ls');

	runner.silent = function() {
		nextOptions.silent = true;
		return runner;
	};

	runner.relax = function() {
		nextOptions.throwOnError = false;
		return runner;
	};

	//TODO: force / noFail / or whatever it is called

	runner.get = function() {
		var buffer = "";
		spawnHelper(toArray(arguments), {
			onOut : function(data) {
				buffer += data.toString();
			}
		});
		return buffer;
	};

	//TODO: getLines, getAll

	function outputToFile(flags) {
		var args = toArray(arguments);
		var mode = args.shift();
		var filename = args.pop();
		//TODO: expand target!
		if (shell.verbose())
			console.log((flags == 'w' ? '>' : '>>') + ' ' + filename);
		var fd = fs.openSync(filename, flags);
		//TODO: Check that stdout isn't defined yet!
		nextOptions.stdout = fd;
		return runner;
	}

	runner.writeTo = outputToFile.bind(null, 'w');
	runner.appendTo = outputToFile.bind(null, 'a');

	/**
	 * Possible alternative syntax:
	 * cat.stream("**.js").writeTo / appendTo / pipe("other command")
	 * grep.read(cat.stream("**.js")).stream("bla.txt").writeTo("bla")
	 */

	//TODO: runner.getOutputStream()
	runner.pipe = function() {
		var child = spawnHelper(toArray(arguments), {
			blocking: false,
			throwOnError: false,
			stdout: 'pipe'
		});
		return command().read(child.stdout);
		//TODO: add guard on next tick that the pipe is fed into a command that was actually called
		//TODO: add guard that input / inputFile isn't called!
	};

	runner.read = function(input) {
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
		return runner;
	};

	runner.readFrom = function(filename) {
		//TODO: check stdin not setyet
		//TODO: expand filename!
		if (shell.verbose())
			console.log('< ' + filename);
		nextOptions.stdin = fs.openSync(filename, 'r');
		return runner;
	};

	runner.code = function() {
		return spawnHelper(toArray(arguments), {
			throwOnError : false
		});
	};

	runner.test = function() {
		return runner.code.apply(this, arguments) === 0;
	};

	runner.detach = function() {
		var child = spawnHelper(toArray(arguments), {
			blocking: false,
			throwOnError: false,
			detached: true
		});
		child.unref(); //do not wait for child to exit
		console.log("[+] " + child.pid);
		return child.pid;
	};

	runner.boundArgs = baseArgs;

	return runner;
};
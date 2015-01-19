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
		return cmd;
	}

	cmd.writeTo = outputToFile.bind(null, 'w');
	cmd.appendTo = outputToFile.bind(null, 'a');

	//TODO: cmd.writeErrorTo
	//TODO: cmd.appendErrorTo

	/**
	 * Possible alternative syntax:
	 * cat.stream("**.js").writeTo / appendTo / pipe("other command")
	 * grep.read(cat.stream("**.js")).stream("bla.txt").writeTo("bla")
	 *
	 * cat.pipe(sort).run('-u')
	 * cat.pipe("sort").run('-u')
	 * cat.pipe().run('-u')
	 */

	//TODO: cmd.stream()
	cmd.pipe = function() {
		var child = spawnHelper(toArray(arguments), {
			blocking: false,
			throwOnError: false,
			stdout: 'pipe'
		});
		return command().read(child.stdout);
		//TODO: add guard on next tick that the pipe is fed into a command that was actually called
		//TODO: add guard that input / inputFile isn't called!
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
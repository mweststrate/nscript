var jsDo = require('./jsdo.js');
var spawn = require('./spawn.js');
var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var stream = require('stream');

module.exports = function command() {
	var commandArgs = arguments;

	function spawnHelper(args, onOut, onErr, blocking) {
		return spawn.spawn(Array.prototype.concat.call(commandArgs, args));
	}

	var runner = function() {
		spawnHelper(arguments);
	};

	runner.get = function() {
		var buffer = "";
		spawnHelper(arguments, function(data) {
			buffer += data.toString();
		});
		return buffer;
	};

	function outputToFile(m) {
		var mode = Array.prototype.shift.apply(arguments);
		var target = Array.prototype.shift.apply(arguments);
		var outStream = fs.createWriteStream(path.join(jsdo.getCwd(), target), {
			flags : mode
		});
		try {
			return spawnHelper(arguments, function(data) {
				outStream.write(data);
			});
		} finally {
			outStream.end();
		}
	}

	runner.writeTo = outputToFile.bind(null, 'w');
	runner.appendToTo = outputToFile.bind(null, 'a');

	runner.pipe = function() {
		var child = spawnHelper(arguments, null, null, false, false);
		spawn.setNextInputStream(child.stdio);
		return command(); //returns a new empty command for immediate follow up
	};

	runner.input = function(input) {
		if (input instanceof stream.Readable)
			spawn.setNextInputStream(input);
		else {
			// http://stackoverflow.com/questions/16038705/how-to-wrap-a-buffer-as-a-stream2-readable-stream#16039177
			var bufferStream = new stream.Transform();
			bufferStream.push(input);
			return this.input(bufferStream);
		}
		return this;
	};

	runner.inputFile = function(filename) {
		return this.input(fs.createReadStream(path.join(jsdo.getCwd(), filename)));
	};

	runner.code = function() {
		return spawnHelper(arguments, null, null, false);
	};

	runner.test = function() {
		return this.code() === 0;
	};

	return runner;
};
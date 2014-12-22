var jsDo = require('./jsdo.js');
var spawn = require('./spawn.js');
var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var stream = require('stream');
var toArray = require('./utils.js').toArray;

module.exports = function command() {
	var commandArgs = toArray(arguments);

	function spawnHelper(moreArgs, onOut, onErr, blocking) {
		var args = toArray(arguments);
		args[0] = commandArgs.concat(moreArgs);
		return spawn.spawn.apply(null, args);
	}

	var runner = function() {
		spawnHelper(toArray(arguments));
	};

	runner.get = function() {
		var buffer = "";
		spawnHelper(toArray(arguments), function(data) {
			buffer += data.toString();
		});
		return buffer;
	};

	function outputToFile(m) {
		var args = toArray(arguments);
		var mode = args.shift();
		var target = args.shift();
		var outStream = fs.createWriteStream(path.join(jsdo.getCwd(), target), {
			flags : mode
		});
		try {
			return spawnHelper(args, function(data) {
				outStream.write(data);
			});
		} finally {
			outStream.end();
		}
	}

	runner.writeTo = outputToFile.bind(null, 'w');
	runner.appendToTo = outputToFile.bind(null, 'a');

	runner.pipe = function() {
		var child = spawnHelper(toArray(arguments), null, null, false, false);
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
		return spawnHelper(toArray(arguments), null, null, false);
	};

	runner.test = function() {
		return this.code() === 0;
	};

	return runner;
};
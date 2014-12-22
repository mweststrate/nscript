var repl = require('repl');
var colors = require('colors/safe');
var stream = require('stream');
var jsDo = require('./jsdo.js');

var active = false;
var pauseCount = 0;
var replServer = null;

var start = exports.start = function() {
	active = true;

	var inputStream = new stream.Transform();
	inputStream._transform = function(data, encoding, callback) {
		//only listen to stdin if no process or prompt is active!
		if (pauseCount === 0)
			this.push(data);
		callback();
	};

	process.stdin.pause();
	process.stdin.pipe(inputStream);
	process.stdin.resume();

	replServer = repl.start({
		prompt: getPrompt(),
		input: inputStream,
		output: process.stdout,
		ignoreUndefined: true,
		useGlobal: true,
		useColors: true
	});
};

function getPrompt() {
	return "[" + jsDo.cwd() + "] $ ";
}

exports.pause = function() {
	pauseCount += 1;
};

exports.resume = function() {
	pauseCount -= 1;
};

exports.updatePrompt = function() {
	if (active)
		replServer.prompt = getPrompt();
};
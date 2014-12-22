var repl = require('repl');
var colors = require('colors/safe');
var stream = require('stream');
var jsDo = require('./jsdo.js');
var Fiber = require('fibers');

var active = false;
var pauseCount = 0;
var replServer = null;

var start = exports.start = function() {
	active = true;
	replServer = repl.start({
		prompt: getPrompt(),
//		input: inputStream,
//		output: process.stdout,
		ignoreUndefined: true,
		useGlobal: true,
		useColors: true
	});

	var eval = replServer.eval;
	replServer.eval = function() {
		var args = arguments;
		new Fiber(function() {
			eval.apply(replServer, args);
		}).run();
	};
};

function getPrompt() {
	return "[" + jsDo.cwd() + "] $ ";
}

exports.pause = function() {
	if (active) {
		if (pauseCount === 0) {
			replServer.parseREPLKeyword(".exit")
		}
		pauseCount += 1;
	}
};

exports.resume = function() {
	if (active) {
		pauseCount -= 1;
		if (pauseCount === 0)
			start();
	}
};

exports.updatePrompt = function() {
	if (active)
		replServer.prompt = getPrompt();
};
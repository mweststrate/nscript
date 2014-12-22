var repl = require('repl');
var colors = require('colors/safe');

var active = false;
var pauseCount = 0;
var replHandle = null;

var start = exports.start = function() {
	active = true;

	replHandle = repl.start({
		prompt: 'do $ ',
		ignoreUndefined: true,
		useGlobal: true,
		useColors: true
	});
};

exports.pause = function() {
	if (active) {
		if (pauseCount === 0) {
			replHandle.parseREPLKeyword(".exit")
			//replHandle.close();
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
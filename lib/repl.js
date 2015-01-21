var repl = require('repl');
var util = require('util');
var colors = require('colors/safe');
var stream = require('stream');
var readline = require('readline');
var Fiber = require('fibers');
var Future = require('fibers/future');
var shell = require('./shell.js');

var pauseCount = 0;
var replServer = null;
var supressEval = false;
var homedir = require('home-dir').directory;

var start = exports.start = function() {
	replServer = repl.start({
		prompt: getPrompt(),
		ignoreUndefined: true,
		terminal: true,
		useGlobal: true,
		useColors: true
	});

	var baseEval = replServer.eval; //TODO: avoid jshint trigger happiness on everything that seems eval
	replServer.eval = function() {
		if (!supressEval) {
			var args = arguments;
			new Fiber(function() {
				baseEval.apply(replServer, args);
			}).run();
		}
	};
};

function getPrompt() {
	var dir = shell.cwd();
	if (dir.indexOf(homedir) === 0)
		dir = "~" + dir.substr(homedir.length);
	return "[nscript] " + dir + " $ ";
	// FEATURE: support colors, needs readline fix for cursor offset!
	//return "[nscript] " + colors.gray(dir) + colors.bold(colors.blue(" $ "));
}



exports.prompt = function(prompt, defaultValue) {
	var useRepl = replServer !== null;
	var future = new Future();
	var rl;

	if (useRepl) {
		rl = replServer.rli;
		supressEval = true;
	}
	else
		rl = readline.createInterface(process.stdin, process.stdout);

	rl.question("" + prompt + (defaultValue ? " [" + defaultValue + "]: " : " "), function(line) {
		future.return(line);
	});
	var line = future.wait();

	if (useRepl)
		supressEval = false;
	else
		rl.close();

	if (shell.verbose())
		console.log(colors.gray("User input: " + line));
	return line.trim() || defaultValue || "";
};

exports.pause = function() {
	if (replServer && pauseCount === 0) {
		replServer.rli.pause();
		process.stdin.setRawMode(false); //make sure Ctrl+D etc still work.
	}
	pauseCount += 1;
};

exports.resume = function() {
	pauseCount -= 1;
	if (replServer && pauseCount === 0){
		replServer.rli.resume();
		process.stdin.setRawMode(true);
	}
};

exports.updatePrompt = function() {
	if (replServer)
		replServer.prompt = getPrompt();
};
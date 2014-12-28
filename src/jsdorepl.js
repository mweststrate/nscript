var repl = require('repl');
var colors = require('colors/safe');
var stream = require('stream');
var Fiber = require('fibers');
var Future = require('fibers/future');
var jsDo = require('./jsdo.js');


var pauseCount = 0;
var replServer = null;
var supressEval = false;

var start = exports.start = function() {
	active = true;
	replServer = repl.start({
		prompt: getPrompt(),
		ignoreUndefined: true,
		terminal: true,
		useGlobal: true,
		useColors: true
	});

	var baseEval = replServer.eval;
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
	return "[" + jsDo.cwd() + "] $ "; //TODO: replace homedir
}

exports.prompt = function(prompt) {
	var useRepl = replServer !== null;
	var future = new Future();
	var rl;

	if (useRepl) {
		rl = replServer.rli;
		supressEval = true;
	}
	else
		rl = readline.createInterface(process.stdin, process.stdout);

	rl.setPrompt("" + prompt + " ");
	rl.prompt();
	rl.once('line', function(line) {
		future.return(line.trim());
	});
	var line = future.wait();

	if (useRepl)
		supressEval = false;
	else
		rl.close();

	if (jsDo.verbose())
		console.log(colors.gray("User input: " + line));
	return line;
}

exports.pause = function() {
	if (pauseCount === 0) {
		replServer.rli.pause();
		process.stdin.setRawMode(false); //make sure Ctrl+D etc still work.
	}
	pauseCount += 1;
};

exports.resume = function() {
	pauseCount -= 1;
	if (pauseCount === 0){
		replServer.rli.resume();
		process.stdin.setRawMode(true);
	}
};

exports.updatePrompt = function() {
	if (active)
		replServer.prompt = getPrompt();
};
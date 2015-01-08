var nscript = require('../src/index.js');
var Fiber = require('fibers');

/**
 * This files tests the nscript CLI, including parameter passing and making scripts executable
 */

//TODO: replace michel with shell.env.USER

//wrap in fiber
function withShell(f) {
	new Fiber(function() {
		f(require('../src/shell.js'));
	}).run();
}

exports.hello1 = function(test) {
	withShell(function(shell) {
		test.equals(shell.get('test/scripts/hello1.js').trim(), 'hello world');
		test.equals(shell.get('test/scripts/hello2.js').trim(), 'hello world');
		test.equals(shell.get('test/scripts/hello3.js').trim(), 'hello world');

		test.equals(shell.get('nscript', 'test/scripts/hello1.js').trim(), 'hello world');
		test.equals(shell.get('node','.','test/scripts/hello1.js').trim(), 'hello world');

		test.equals(shell.get('node', 'test/scripts/hello2.js').trim(), 'hello world');
		test.equals(shell.get('nscript', 'test/scripts/hello3.js').trim(), 'hello world');

		test.done();
	});
}

exports.hello3 = function(test) {
	require('./scripts/hello3.js').run();
	test.done();
}

exports.hello2 = function(test) {
	withShell(function(shell) {
		var verboseOutput = "Starting nscript test/scripts/hello-params.jsmichel\nStarting: echo hello michel\nhello michel\nFinished with exit code: 0\nFinished in 0 seconds"
		test.equals(shell.get('test/scripts/hello-params.js','michel').trim(), 'hello michel');
		test.equals(shell.get('test/scripts/hello-params.js',{greeting: "hi"},'michel').trim(), 'hi michel');
		test.equals(shell.get('test/scripts/hello-params.js','michel','--greeting', 'hi').trim(), 'hi michel');

		test.equals(shell.get('nscript', '-v', 'test/scripts/hello-params.js','michel').trim(), verboseOutput);
		test.equals(shell.get('nscript', '-C','test/scripts', 'hello-params.js','michel').trim(), 'hello michel');
		test.equals(shell.get('node', '.', '-C','test/scripts', 'hello-params.js','michel').trim(), 'hello michel');
		test.done();
	});
}

exports.touch = function(test) {
	withShell(function(shell) {
		shell("rm","-rf", "test/tmp");
		shell("mkdir","-p", "test/tmp");

		shell("nscript", "--touch", "test/tmp/1.js");
		test.equals(shell.get('test/tmp/1.js').trim(), 'hello world');

		shell("chmod","-x", 'test/tmp/1.js');
		test.fail(shell.test('test/tmp/1.js'));

		shell("nscript", "-x", "test/tmp/1.js");
		test.equals(shell.get('test/tmp/1.js').trim(), 'hello world');

		shell("nscript", "--touch", "test/tmp/2.js", "--local");
		test.equals(shell.get('test/tmp/2.js').trim(), 'hello world');

		test.done();
	});
}

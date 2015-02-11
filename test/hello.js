var nscript = require('../lib/index.js');
var Fiber = require('fibers');

/**
 * This files tests the nscript CLI, including parameter passing and making scripts executable
 */

//wrap in fiber
function withShell(f) {
	new Fiber(function() {
		try {
			f(require('../lib/shell.js'));
		}
		catch (e) {
			console.error(e);
			throw e;
		}
	}).run();
}

exports.hello1 = function(test) {
	withShell(function(shell) {
		test.equals(shell.get('test/scripts/hello1.js').trim(), 'hello world');

		// relative scripts should work as well; unike normal bash
		shell.cd('test/scripts');
		test.equals(shell.get('./hello1.js').trim(), 'hello world');
		test.equals(shell.get('hello1.js').trim(), 'hello world');
		shell.cd();

		test.equals(shell.get('test/scripts/hello2.js').trim(), 'hello world');
		test.equals(shell.get('test/scripts/hello3.js').trim(), 'hello world');

		test.equals(shell.get('nscript', 'test/scripts/hello1.js').trim(), 'hello world');
		test.equals(shell.get('node','.','test/scripts/hello1.js').trim(), 'hello world');

		test.equals(shell.get('node', 'test/scripts/hello2.js').trim(), 'hello world');
		test.equals(shell.get('nscript', 'test/scripts/hello3.js').trim(), 'hello world');

		test.done();
	});
};

exports.hello3 = function(test) {
	require('./scripts/hello3.js').run();
	test.done();
};

exports.hello2 = function(test) {
	withShell(function(shell) {
		test.equals(shell.get('test/scripts/hello-params.js','michel').trim(), 'hello michel');
		test.equals(shell.get('test/scripts/hello-params.js',{greeting: "hi"},'michel').trim(), 'hi michel');
		test.equals(shell.get('test/scripts/hello-params.js','michel','--greeting', 'hi').trim(), 'hi michel');

		test.equals(shell.getError('nscript', 'test/scripts/hello-params.js','michel').trim(), '');
		test.notEqual(shell.getError('nscript', '-v', 'test/scripts/hello-params.js','michel').trim(), '');
		test.equals(shell.get('nscript', '-C','test/scripts', 'hello-params.js','michel').trim(), 'hello michel');
		test.equals(shell.get('node', '.', '-C','test/scripts', 'hello-params.js','michel').trim(), 'hello michel');
		test.done();
	});
};

exports.touch = function(test) {
	withShell(function(shell) {
		shell("rm","-rf", "test/tmp");
		shell("mkdir","-p", "test/tmp");

		shell("nscript", "--touch", "test/tmp/1.js");
		test.equals(shell.get('test/tmp/1.js').trim(), 'Hello world');

		shell("chmod","-x", 'test/tmp/1.js');
		test.equals(shell.test('test/tmp/1.js'), false);

		shell("nscript", "-x", "test/tmp/1.js");
		test.equals(shell.get('test/tmp/1.js').trim(), 'Hello world');

		shell("nscript", "--touch", "test/tmp/2.js", "--local");
		//Fix nscript reference, which is not available locally as node_module in this project..
		shell.write("test/tmp/2.js", shell.read("test/tmp/2.js").replace("require(nscript)", "require('../../')"));
		test.equals(shell.get('test/tmp/2.js').trim(), 'Hello world');

		test.done();
	});
};

exports.readme = function(test) {
	withShell(function(shell) {
		test.equals(shell.cmd("examples/readme.js").test(), true);
		test.done();
	});
}
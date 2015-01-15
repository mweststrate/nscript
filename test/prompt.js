var nscript = require('../src/index.js');
var Fiber = require('fibers');
var buffer = require('buffer');

/* This file tests all api's exposed by command and shell */

//wrap in fiber
function withShell(f) {
	new Fiber(function() {
		try {
			f(require('../src/shell.js'));
		}
		catch(e) {
			console.error(e);
			console.log(e.stack);
			throw e;
		}
	}).run();
}

exports.testPipe = function(test) {
	withShell(function(shell) {
		test.equals(shell.pipe("echo","hi").code("cat"),0);
		test.equals(shell.pipe("echo","hi").get("cat"),"hi\n");

		test.done();
	});
};

exports.testPrompt = function(test) {
	withShell(function(shell) {
		test.equals(
			shell.read("hi")
			.code(createTempScript(shell,"if ('hi' !== shell.prompt('<testing>')) throw 'fail';")),
			0
		);
		test.equals(
			shell.read("")
			.code(createTempScript(shell,"if ('hi' !== shell.prompt('<testing>','hi')) throw 'fail';")),
			0
		);
		test.equals(
			shell.pipe("echo","hi")
			//.code("cat"),
			.code(createTempScript(shell,"var x;if ('hi' !== (x = shell.prompt('<testing>'))) throw 'fail:'+x;")),
			0
		);
		test.equals(
			shell.code(createTempScript(shell,"if ('hi' !== shell.prompt('type \\\'hi\\\' manually please:')) throw 'fail';")),
			0
		);

		test.done();
	});
}

function createTempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid
	shell.writeString(s, "#!/usr/bin/nscript\nmodule.exports=function(shell){"+script+"}");
	shell("chmod","+x", s);
	return s;
}
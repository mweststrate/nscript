var nscript = require('../lib/index.js');
var Fiber = require('fibers');
var buffer = require('buffer');

/* This file tests all api's exposed by command and shell */

//wrap in fiber
function withShell(f) {
	new Fiber(function() {
		try {
			f(require('../lib/shell.js'));
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
		test.equals(shell.cmd("echo","hi").spawn().pipe("cat").code(),0);
		test.equals(shell.cmd("echo","hi").pipe("cat").get(),"hi\n");
		test.equals(
			shell.alias("echo","hi")
			.pipe("sh","-c",["read -p test BLABLA; echo $BLABLA"])
			.get(),
			"hi\n"
		);

		test.done();
	});
};

exports.testPrompt = function(test) {
	withShell(function(shell) {
		shell.verbose(false);
		test.equals(
			shell.cmd(createTempScript(shell,"if ('hi' !== shell.prompt('<testing>')) throw 'fail';")).input("hi")
			.code(),
			0
		);
		test.equals(
			shell.cmd().input("")
			.code(createTempScript(shell,"if ('hi' !== shell.prompt('<testing>','hi')) throw 'fail';")),
			0
		);
		var prompter = createTempScript(shell,"var x;if ('hi' !== (x = shell.prompt('<testing>'))) throw 'fail:'+x;");
		test.equals(
			shell.cmd("echo","hi").spawn().pipe(prompter)
			//.code("cat"),
			.code(),
			0
		);
		test.equals(
			shell.code(createTempScript(shell,"if ('hi' !== shell.prompt('type \\\'hi\\\' manually please:')) throw 'fail';")),
			0
		);

		shell.verbose(false);
		test.done();
	});
};

function createTempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid;
	shell.write(s, "#!/usr/bin/nscript\nmodule.exports=function(shell){"+script+"}");
	shell("chmod","+x", s);
	return s;
}
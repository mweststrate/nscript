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

/*
    - [shell](#shell)
      - [shell.alias(boundArgs)](#shellaliasboundargs)
      - [shell.exit(exitCode)](#shellexitexitcode)
      - [shell.cwd()](#shellcwd)
      - [shell.cd(dir)](#shellcddir)
      - [shell.prompt(prompt)](#shellpromptprompt)
      - [shell.lastExitCode](#shelllastexitcode)
      - [shell.pid](#shellpid)
      - [shell.env](#shellenv)
      - [shell.colors](#shellcolors)
      - [shell.nscript(nscriptFunction)](#shellnscriptnscriptfunction)
      - [shell.glob(pattern, opts)](#shellglobpattern-opts)
      - [shell.verbose(boolean)](#shellverboseboolean)
      - [shell.useGlobals()](#shelluseglobals)
 */
exports.testShell = function(test) {
	withShell(function(shell) {
		test.equals(shell.code("nscript", tempScript(shell, "shell.exit(13)")),13);

		test.ok(shell.pid);
		test.ok(shell.env.USER);
		test.equals(shell.env.USER,shell.get("whoami").trim())

		test.deepEqual(shell.glob("**/command.js"),["src/command.js", "test/command.js"]);

		shell.code("false");
		test.deepEqual(shell.lastExitCode, 1);
		shell.code("true");
		test.deepEqual(shell.lastExitCode, 0);

		test.equals(typeof code, 'undefined');
		shell.useGlobals();
		test.equals(typeof code, 'function');

		shell.nscript(function(subshell, echo) {
			test.equals(subshell.get("echo", "hi"), "hi\n");
			test.equals(echo.get("echo"), "echo\n");
			test.done();
		});
	});
}

exports.testPrompt = function(test) {
	withShell(function(shell) {
// 		TODO: enable tests
//		test.deepEqual(shell.run(tempScript(shell,"shell('echo', 'got', shell.prompt('type \\\'hi\\\' manually please:'));")),"got hi\n");
//		test.deepEqual(shell.read("hi").run(tempScript(shell,"shell('echo', 'got', shell.prompt('will receive \\\'hi\\\':'));")),"got hi\n");
//		test.deepEqual(shell.pipe("echo","hi").run(tempScript(shell,"shell('echo', 'got', shell.prompt('will receive \\\'hi\\\':'));")),"got hi\n");

		test.done();
	});
}


exports.testCd = function(test) {
	withShell(function(shell) {
		test.equals(!!shell.cwd().match(/\/$/), true);
		var base = process.cwd() + "/";
		test.equals(shell.cwd(), base);
		shell.cd("node_modules");
		shell.get("ls").indexOf("glob") != -1;
		test.equals(shell.cwd(), base + "node_modules/");

		shell.cd();
		test.equals(shell.cwd(), base);
		shell.cd("node_modules/glob");
		shell.get("ls").indexOf("safe.js") != -1;

		test.ok(shell.env.USER);
		test.equals(shell.get("whoami").trim(),shell.env.USER);
		shell.cd("/home/");
		shell.get("ls").indexOf(shell.env.USER) != -1;

		shell.cd("~/Desktop");
		test.equals(shell.cwd(), "/home/" + shell.env.USER + "/Desktop/");
		shell.cd("~/Desktop/");
		test.equals(shell.cwd(), "/home/" + shell.env.USER + "/Desktop/");

		test.equals(shell.pwd(), shell.cwd());
		shell.cd();
		test.equals(shell.pwd(), base);
		test.done();
	});
}

exports.testUtils = function(test) {
	withShell(function(shell) {
		var txtFile = "/tmp/" + shell.pid + "_tmp_txt";
		shell.writeString(txtFile,"abc\u2342de")
		test.equals(shell.readString(txtFile), "abc\u2342de");

		cd('test');
		test.equals(shell.isDir('scripts'), true);
		test.equals(shell.isFile('scripts'), false);
		test.equals(shell.isDir('command.js'), false);
		test.equals(shell.isFile('command.js'), true);
		test.equals(shell.isDir('bla.js'), false);
		test.equals(shell.isFile('bla.js'), false);
		test.equals(shell.isFile('/usr/bin/node'), true);
		test.equals(shell.isFile('~/.profile'), true);
		test.equals(shell.isFile('~/.profileBla'), false);

		test.deepEqual(shell.files('scripts'), ['scripts/hello-params.js', 'scripts/hello1.js','scripts/hello2.js', 'scripts/hello3.js']);

		cd('scripts');
		test.deepEqual(shell.files('.'), ['hello-params.js', 'hello1.js','hello2.js', 'hello3.js']);
		test.deepEqual(shell.files(), ['hello-params.js', 'hello1.js','hello2.js', 'hello3.js']);

		cd();
		test.done();
	});
}

function tempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid
	shell.writeTo(s)("echo",["#!/usr/bin/nscript\nmodule.exports=function(shell){"+script+"}"]);
	shell("chmod","+x", s);
	return s;
}
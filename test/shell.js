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
		test.equals(shell.env.USER,shell.get("whoami").trim());

		test.deepEqual(shell.glob("**/command.js"),["lib/command.js", "test/command.js"]);

		shell.code("false");
		test.deepEqual(shell.lastExitCode, 1);
		shell.code("true");
		test.deepEqual(shell.lastExitCode, 0);

		test.equals(typeof code, 'undefined');
		shell.useGlobals();
		test.equals(typeof code, 'function');

		test.equals(shell.alias("echo").get("hi"),"hi\n");
		test.equals(shell.cmd("echo").get("hi"),"hi\n");
		test.equals(shell.run("echo", "hi"), 0);
		var getEcho = shell.alias("echo", { n:true }, "hello").get;
		test.equals(getEcho("world"),"hello world");


		try {
			shell.run("false");
			test.fail("expected exception");
		}
		catch (e) {
			test.equals(e.name, 'NonZeroExitError');
			// Got exception
		}
		try {
			shell.run("foep");
			test.fail("expected exception");
		}
		catch (e) {
			test.equals(e.name, 'FailedToStartError');
			// Got exception
		}

		shell.nscript(function(subshell, echo) {
			test.equals(subshell.get("echo", "hi"), "hi\n");
			test.equals(echo.get("echo"), "echo\n");
			test.done();
		});
	});
};

exports.testCd = function(test) {
	withShell(function(shell) {
		test.equals(!!shell.cwd().match(/\/$/), true);
		var base = process.cwd() + "/";
		test.equals(shell.cwd(), base);
		shell.cd("node_modules");
		test.notEqual(shell.get("ls").indexOf("glob"),-1);
		test.equals(shell.cwd(), base + "node_modules/");

		shell.cd();
		test.equals(shell.cwd(), base);
		shell.cd("node_modules/glob");
		test.notEqual(shell.get("ls").indexOf("sync.js"),-1);

		test.ok(shell.env.USER);
		test.equals(shell.get("whoami").trim(),shell.env.USER);
		shell.cd("/home/");
		test.notEqual(shell.get("ls").indexOf(shell.env.USER), -1);

		shell.cd("~/Desktop");
		test.equals(shell.cwd(), "/home/" + shell.env.USER + "/Desktop/");
		shell.cd("~/Desktop/");
		test.equals(shell.cwd(), "/home/" + shell.env.USER + "/Desktop/");

		test.equals(shell.pwd(), shell.cwd());
		shell.cd();
		test.equals(shell.pwd(), base);
		test.done();
	});
};

exports.testUtils = function(test) {
	withShell(function(shell) {
		var txtFile = "/tmp/" + shell.pid + "_tmp_txt";
		shell.write(txtFile,"abc\u2342de");
		shell.append(txtFile,"\nboe");
		test.equals(shell.read(txtFile), "abc\u2342de\nboe");

		shell.cd('test');
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

		shell.cd('scripts');
		test.deepEqual(shell.files('.'), ['hello-params.js', 'hello1.js','hello2.js', 'hello3.js']);
		test.deepEqual(shell.files(), ['hello-params.js', 'hello1.js','hello2.js', 'hello3.js']);

		shell.cd();
		test.done();
	});
};

function tempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid;
	shell.spawn("echo",["#!/usr/bin/nscript\nmodule.exports=function(shell){"+script+"}"]).write(s).wait();
	shell("chmod","+x", s);
	return s;
}
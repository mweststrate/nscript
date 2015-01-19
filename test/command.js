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
- [Command](#command)
      - [command.run(args)](#commandrunargs)
      - [command.code(args)](#commandcodeargs)
      - [command.test(args)](#commandtestargs)
      - [command.get(args)](#commandgetargs)
      - [command.read(data)](#commandreaddata)
      - [command.pipe(args)](#commandpipeargs)
      - [command.readFrom(filename)](#commandreadfromfilename)
      - [command.writeTo(args, filename)](#commandwritetoargs-filename)
      - [command.appendTo(args, filename)](#commandappendtoargs-filename)
      - [command.silent()](#commandsilent)
      - [command.relax()](#commandrelax)
      - [command.boundArgs](#commandboundargs)
      - [command.detach(args)](#commanddetachargs)

 */

exports.testCommand = function(test) {
	debugger;
	withShell(function(shell) {
		debugger;
		test.equals(shell.alias().run('test/scripts/hello1.js'), 0);

		test.equals(shell.alias().code('true'), 0);
		test.equals(shell.alias().code('false'), 1);

		test.equals(shell.alias().test('true'), true);
		test.equals(shell.alias().test('false'), false);

		test.equals(shell.alias().get('test/scripts/hello1.js'), "hello world\n");

		test.equals(shell.alias().read("hi").get("cat"),"hi\n");
		test.equals(shell.alias().read(new buffer.Buffer("hi")).get("cat"),"hi\n");

		test.equals(shell.alias().writeTo("/tmp/nscript_" + shell.pid)("echo","hi"), 0)
		test.equals(shell.alias().appendTo("/tmp/nscript_" + shell.pid)("echo","hi"), 0)
		test.equals(shell.alias().readFrom("/tmp/nscript_" + shell.pid).get("cat"),"hi\nhi\n");

		//test silent:
		test.equals(shell.alias().writeTo("/tmp/nscript_" + shell.pid)("echo","module.exports=function(shell,echo){echo.silent()(3);echo(2);}"), 0);
		test.equals(shell.get("nscript","/tmp/nscript_" + shell.pid),"2\n");

		test.equals(shell.relax()("false"),1);

		test.deepEqual(shell.alias("echo","*.js").boundArgs,["echo","*.js"]);
		test.equals(shell.alias("echo","-n").get("3"),"3");

		//TODO: add test for relax() + -1 (not spawning), should fail

		//test detach and pipe
		var now = +(new Date);
		var pid = shell.detach("sleep",3);
		test.ok(+(new Date) - now < 2000);

		test.equals(shell.get("ps", "h", pid).trim().split("\n").length, 1);
		//both grep and sleep might appear in ps aux
		test.ok(shell.pipe("ps","auxh").get("grep",pid).trim().split("\n").length >= 1)

		setTimeout(function() {
			//pid is now killed,
			//only grep will appear in ps aux
			withShell(function(shell) {
				test.equals(shell.test("ps","h",pid),false);
				test.done();
			});
		}, 5000)

	});
}

function tempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid
	shell.writeTo(s)("echo",["#!/usr/bin/nscript\nmodule.exports=function(shell){"+script+"}"]);
	shell("chmod","+x", s);
	return s;
}
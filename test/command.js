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
	withShell(function(shell) {
		test.equals(shell.alias().run('test/scripts/hello1.js'), 0);

		test.equals(shell.alias().code('true'), 0);
		test.equals(shell.alias().code('false'), 1);

		test.equals(shell.cmd().test('true'), true);
		test.equals(shell.alias().test('false'), false);

		test.equals(shell.alias().get('test/scripts/hello1.js'), "hello world\n");
		test.equals(shell.cmd("echo","1").args("2","3").args("4").get("5"), "1 2 3 4 5\n");

		test.equals(shell.alias().input("hi").get("cat"),"hi");
		test.equals(shell.alias().input(new buffer.Buffer("hi")).get("cat"),"hi");

		test.equals(shell.cmd("echo","hi").write("/tmp/nscript_bla" + shell.pid), 0);
		test.equals(shell.cmd("echo","hi").append("/tmp/nscript_bla" + shell.pid), 0);
		test.equals(shell.alias().read("/tmp/nscript_bla" + shell.pid).get("cat"),"hi\nhi\n");

		test.deepEqual(shell.getLines("cat", "test/groceries.txt"), ["apples","milk","pears","fruity milk","coffee milk"]);

		//test silent:
		test.equals(shell.cmd(tempScript(shell, "var echo=shell.alias('echo');echo(1);echo.silent()(2);echo(3);")).write("/tmp/nscript_boe" + shell.pid), 0);
		test.equals(shell.read("/tmp/nscript_boe" + shell.pid),"1\n3\n");

		test.equals(shell.get(tempScript(shell,"console.log(shell.get('echo','hi').length)")),"3\n");
		test.equals(shell.get(tempScript(shell,"console.log(shell.alias('echo').get('hi').length)")),"3\n");

		test.equals(shell.cmd().relax()("false"),1);

		test.deepEqual(shell.alias("echo","*.js").boundArgs,["echo","*.js"]);
		test.equals(shell.alias("echo","-n").get("3"),"3");

		test.equals(shell.cmd(tempScript(shell, "console.log('out');console.error('error')")).spawn().write("/tmp/nscript_out_" + shell.pid).writeError("/tmp/nscript_err_" + shell.pid).code(), 0);
		test.equals(shell.read("/tmp/nscript_out_" + shell.pid),"out\n");
		test.equals(shell.read("/tmp/nscript_err_" + shell.pid),"error\n");

		test.equals(shell.cmd().env("USER","world").env({ SOMEVAR : 7}).get(tempScript(shell, "console.log(process.env.USER, process.env.SOMEVAR);")), "world 7\n");

		//TODO: add test for relax() + -1 (not spawning), should fail

		//test detach and pipe
		var now = +(new Date());
		var pid = shell.detach("sleep",3);
		test.ok(+(new Date()) - now < 2000);

		test.equals(shell.get("ps", "h", pid).trim().split("\n").length, 1);
		//both grep and sleep might appear in ps aux
		test.ok(shell.cmd("ps","auxh").pipe("grep",pid).get().trim().split("\n").length >= 1);

		setTimeout(function() {
			//pid is now killed,
			//only grep will appear in ps aux
			withShell(function(shell) {
				test.equals(shell.test("ps","h",pid),false);
				test.done();
			});
		}, 5000);

	});
};

exports.testActiveFiberException = function(test) {
	nscript(function(shell) {
		test.equals(shell.cmd("ls").silent().test(), true);
		setImmediate(function() {
			try {
				shell.run("ls");
				test.fail();
			}
			catch (e) {
				test.equals(e.name, 'NotInNscriptFunction');
			}
			test.done();
		});
	});
};

function tempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid;
	shell.cmd("echo",["#!/usr/bin/nscript\nmodule.exports=function(shell){"+script+"}"]).write(s);
	shell("chmod","+x", s);
	return s;
}
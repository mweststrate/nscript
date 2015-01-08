var nscript = require('../src/index.js');
var Fiber = require('fibers');
var buffer = require('buffer');

/* This file tests all api's exposed by command and shell */

//wrap in fiber
function withShell(f) {
	new Fiber(function() {
		f(require('../src/shell.js'));
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

		test.equals(shell.alias().test('true'), true);
		test.equals(shell.alias().test('false'), false);

		test.equals(shell.alias().get('test/scripts/hello1.js'), "hello world\n");

		test.equals(shell.alias().read("hi").get("cat"),"hi");
		test.equals(shell.alias().read(new buffer.Buffer("hi")).get("cat"),"hi");

		test.equals(shell.alias().writeTo("/tmp/nscript_" + shell.pid)("echo","hi"), 0)
		test.equals(shell.alias().appendTo("/tmp/nscript_" + shell.pid)("echo","hi"), 0)
		test.equals(shell.alias().readFrom("/tmp/nscript_" + shell.pid).get("cat"),"hi\nhi\n");

		//test silent:
		test.equals(shell.alias().writeTo("/tmp/nscript_" + shell.pid)("echo","module.exports=function(shell,echo){echo.silent()(3);echo(2);}"), 0);
		test.equals(shell.get("nscript","/tmp/nscript_" + shell.pid),"2\n");

		test.equals(shell.relax()("false"),1);

		test.deepEqual(shell.alias("echo","*.js").boundArgs,["echo","*.js"]);
		test.equals(shell.alias("echo","-n").get("3"),"3");

		//test detach and pipe
		var now = +(new Date);
		var pid = shell.detach("sleep",3);
		test.ok(+(new Date) - now < 2000);

		//both grep and sleep will appear in ps aux
		test.equals(shell("ps", "h").get(pid).split("\n"), 2);
		test.equals(shell("ps","aux").pipe("grep","sleep").get().split("\n").length, 2)

		setTimeout(function() {
			//only grep will appear in ps aux
			test.equals(shell("ps","h").get(pid).split("\n"), 0);
			test.equals(shell("ps","aux").pipe("grep").get("split").split("\n").length, 1)

			test.done();
		}, 5000)

	});
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
exports.tesShell = function(test) {
	withShell(function(shell) {
		test.equals(shell.code("nscript", tempScript(shell, "exit 13")),13);

		test.ok(shell.pid);
		test.ok(shell.env.USER);
		test.equals(shell.env.USER,shell.get("whoami"))

		test.deepEquals(shell.glob("**/command.js"),["src/command.js", "test/command.js"]);

		shell.code("false");
		test.deepEquals(shell.lastExitCode, 1);
		shell.code("true");
		test.deepEquals(shell.lastExitCode, 0);

		test.deepEquals(shell("echo","hi").pipe(tempScript(shell,"shell(echo('got', shell.prompt('type hi')));")),"got hi\n");

		test.equals(typeof 'code', 'undefined');
		shell.useGlobals();
		test.equals(typeof 'code', 'function');

		shell.nscript(function(subshell, echo) {
			test.equals(subshell.get("echo", "hi"), "hi\n");
			test.equals(echo.get("echo"), "hi\n");
			test.done();
		});
	});
}

exports.testCd = function(test) {
	withShell(function(shell) {
		var base = process.cwd();
		test.equals(shell.cwd(), base);
		shell.cd("node_modules");
		shell.get("ls").indexOf("glob") != -1;
		test.equals(shell.cwd(), base + "node_modules/");

		shell.cd();
		test.equals(shell.cwd(), base);
		shell.cd("node_modules/glob");
		shell.get("ls").indexOf("safe.js") != -1;

		test.ok(shell.env.USER);
		test.equals(shell.get("whoami"),shell.env.USER);
		shell.cd("/home/");
		shell.get("ls").indexOf(shell.env.USER) != -1;

		shell.cd("~/Desktop");
		test.equals(shell.cwd(), "/home/" + shell.env.USER + "/Desktop");

		test.equals(shell.pwd(), shell.cwd());
		shell.cd();
		test.equals(shell.pwd(), base);
	});
}


function tempScript(shell, script) {
	var s = "/tmp/nscript_tmp_" + shell.pid
	shell("echo",["module.exports=function(shell){"+script+"}"]).writeTo(s)();
	return s;
}
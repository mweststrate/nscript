# nscript

*Write shell scripts like a bearded guru by unleashing your javascript skills!*

`nscript` is a tool to write (sophisticated) shell scripts using javascript. It offers synchronous [process spawning](https://github.com/mweststrate/nscript/wiki/API-Documentation), [command line argument parsing](https://github.com/mweststrate/nscript/wiki/Using-Command-Line-Arguments), [parameter expansions](https://github.com/mweststrate/nscript/wiki/Argument-expansion), parallel execution, stream redirection, pipes; in short; anything that you liked about bash is now possible in javascript. `nscript` ships with a [REPL](https://github.com/mweststrate/nscript/wiki/Nscript-REPL-and-CLI-arguments) as well.

```javascript
#!/usr/bin/nscript
module.exports = function(shell, echo, $beard) {
  if ($beard)
    echo("Awesome, you invoked this script with --beard. You probably have one.");
  else if (shell.prompt("Do you have a mustache at least?","y") === "y")
    echo("Welcome, oh hairy ", shell.env.USER);
  else
    shell.exit(1, "Epic fail.");
};
```

```
$ ./unixian.js
Do you have a mustache at least? [y]: n
Epic fail.
$
```

# Installing `nscript`

Install `nscript` using: `npm install [-g] nscript`.

`nscript` relies on [node-gyp](https://github.com/TooTallNate/node-gyp), so if any errors occur upon installation, check its [dependencies](https://github.com/TooTallNate/node-gyp#installation).

# nscript primer

An `nscript` script is just a function exposed by a CommonJS module, preceded by a hashbang. The first parameter passes in the `shell` object, other parameternames are filled with wrapped executables with the same name. Use `$flag` or `$$param` as parameter names to make it possible for users to pass in arguments to your script.

The full [API documentation](https://github.com/mweststrate/nscript/wiki/API-Documentation)

```javascript
#!/usr/bin/nscript
module.exports = function(shell, grep, ls, cat, echo, gedit, sort, whoami) {

  // run a command
  // bash: echo hello world
  echo("hello","world")

  // use shell expansions
  // bash: echo src/*.js
  echo("lib/*.js")

  // or, to display all files recusively in lib/
  cat("lib/**/*.js")

  // prevent shell expansion
  // bash: echo 'lib/*.js'
  echo(["lib/*.js"])

  // obtain output
  var result = echo.get("hello","world")

  // nest commands
  // bash: echo hello `whoami`
  echo("hello", whoami.get())

  // check exit status
  // bash: echo hello world; echo $?
  var exitCode = echo.code("hello","world")

  // supress output
  // bash: ls > /dev/null
  ls.silent().run()

  // write output to file
  // bash: ls > dir.txt
  ls.write('test/tmp/dir.txt')

  // append output to file
  // bash: ls >> dir.txt
  ls.append('test/tmp/dir.txt')


  // pipe data into a process
  // bash: echo "pears\napples" | sort
  sort.input("pears\napples").run()

  // prompt for input
  // bash: echo -n "Your age? "; read $AGE
  var age = shell.prompt("Your age?")

  // start a process in the background
  // bash: gedit test/groceries.txt &
  gedit.detach("test/groceries.txt")

  /*
    command.spawn(arguments) provides fine grained input / output control
   */

  // pipe processes
  // bash: ls src/ | grep '.js' | sort -i
  var sortedMilks = ls.spawn("test/groceries.txt").pipe(grep,"milk").pipe(sort,"-i").get()

  // append standard error to file
  // bash: ls *.js 2>> errors.txt | sort -u
  ls.spawn("lib/*.js").appendError('test/tmp/errors.txt').pipe(sort, "-u").wait()

  // read input from file and to file
  // bash: grep milk < groceries.txt > milksonly.txt
  grep.read('test/groceries.txt').spawn('milk').write('test/tmp/milksonly.txt').wait()
}
```

# Processing command line arguments

TODO: short primer about command line arguments.

For the full details see the [documentation](https://github.com/mweststrate/nscript/wiki/Using-Command-Line-Arguments)

# Anatomy of a `nscript` script

The anatomy of script file can best be explained by looking at the following example script:

```javascript
#!/usr/bin/nscript
module.exports = function(shell, $0, echo, whoami) {
	if ($0)
		echo("Hello, ", $0)
	else
		echo("Hello, ", whoami.get())
}
```

The lines explained in detail:

1. The first line is a so called `shell bang` to indicate unix based systems how to run this script. It is basically sugar for `nscript thisfile.js`. The line is further meaningless and ignored by node.
2. A `nscript` script exposes a single function through `module.exports`. This is the function that will be interpreted and run by `nscript`. Of course it is possible to define many functions in the javascript file, but only one should be exposed.
3. `$0` is the first argument passed to this script. See the next sections for more about passing (named) arguments to `nscript` scripts.
4. `echo` is passed into the function by `nscript` as an alias for the "echo" command. This is basically sugar for: `var echo = shell.alias("echo");`. By invoking the `echo` function, `nscript` starts the `echo` executable, and passes in the arguments provided to the function.
5. `whoami` is an alias for the "whoami" command, which returns the name of the currently logged in user (on Unix systems). The `.get()` functions grabs the standard output of a command. In this cause, the output is passed to echo. (In shell scripts, this statement would be expressed as ``echo "Hello, " `whoami` ``.


# Running nscripts without global `nscript`.

If `nscript` is installed as module of your node project, you can also start `nscript` scripts without requiring a globally installed nscript:

```javascript
#!/usr/bin/env node
require('nscript')(function(shell, echo, $0) {
  echo("Hello", $0);
});
```

```bash
$ ./greeter.js Michel
Hello Michel
```

# Creating scripts with `nscript --touch`

To quickly start with a new script, you can use the convenient `nscript --touch` command, but of course you can also create script manually. `nscript` scripts are just plain javascript (commonjs module) files. The `--touch` command also makes sure the script will be executable. Use the additional `--local` if the script shouldn't rely on a globally installed nscript, but a `node` project dependency instead.

```
michel@miniub ~/demo $ nscript --touch myscript.js
Generating default script in 'myscript.js'
Marking script as executable: 'myscript.js'
michel@miniub ~/demo $ ./myscript.js
Hello, world!
```

# Random questions

## Starting nscripts programmatically

This option does not require `nscript` to be installed globally.

```
$ npm install nscript --save
```

```javacript
require('nscript')(require('./script.js'));
```

# Future plans

1. Windows support
2. Rely on child_process.spawnSync instead of fibers for synchronous executing.

# Comparison to other tools.

## Grunt

Grunt allows for high level declaritive writing of tasks. However, spawning new jobs, grabbing there output or using pipes and stdin/ stdout streams can not be done out of the box. Luckily, `nscript` can be used from within grunt scripts as well, so feel free to combine the best of both worlds! Or feel free to write a grunt-nscript plugin ;-).

## ShellJS

ShellJS is an excellent tool and performs many typical build script tasks in a synchronous manner. Furthermore it behaves consistently on all platforms.

Nscript tries to be a more heavy duty tool and does not (yet) fully support windows. On the other hand, it supports more typical shell (for example `bash`) features. Some differences with ShellJS:

* nscript allows for parallel execution of commands, even if they are invoked in a synchronously / blocking manner. See for example `tests/shell.js testParallel`
* nscripts is very flexibile in input and output stream handling, it is possible to pipe streams, redirect to output (without buffering) or processing output streams in parallel. TODO: add test case for onLine(cb) + wait()
* ShellJS offers a default implementation of several system commands. The advantage of this is that they work uniform on every platform, the disadvantage is that only a limited set of features is supported
* nscript aims to help you to write fully fledged shell scripts and offers command line parsing out of the box
* it is possible start processes in the background
* nscript is more efficient in its approach to spawn processes synchronously; it doesn't [block](http://strongloop.com/strongblog/node-js-callback-hell-promises-generators/) the main event loop
* in short: nscript offers more fine grained process control, ShellJS offers less features, but the features that are offered are platform consistent and the api is a bit simpler.
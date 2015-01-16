# nscript

*Javascript powered shell scripts*

_Writing shell scripts is hard. But if a program just takes some input and generates some output, a **program** could be considered  a **function**. Invoking functions and reasoning about parameters and return values is a very natural thing to do in any GPL, such as **javascript**. So lets start writing shell scripts in javascript. Without any further introduction, I hereby present you `nscript`:_

```javascript
#!/usr/bin/nscript
// A nscript script is just a function exposed by a CommonJS module
// This script has multiple arguments, the search query, and optional --dir and --filetype flags
module.exports = function(shell, grep, $$filetype, $$dir, $0) {
	// change search directory of the script if --dir is provided
	if ($$dir)
		shell.cd($$dir);
	// run grep. Grep fails if it doesn't find anything, so test the return value
	if (!grep.test(
		// grep options: F: take search literal, i: case insensitive, n: show line numbers
		"-F", "-i", "-n",
		// pass in the search query literally using brackets. Prompt for a search query if not set
		[$0 || shell.prompt('Please enter your search text:')],
		// apply the filter. nscript expands asterixes and other glob patterns automatically
		$$filetype ? '**/*.'+ $$filetype : '**/*',
		'/dev/null'
	))
		console.log("No matches found for '" + $0 +"'");
}
```

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Introduction](#introduction)
- [Getting started with `nscript`](#getting-started-with-nscript)
  - [Installing `nscript`](#installing-nscript)
  - [Creating and running your first script](#creating-and-running-your-first-script)
- [Anatonomy of a `nscript`](#anatonomy-of-a-nscript)
  - [Main `nscript` concepts](#main-nscript-concepts)
- [API Documentation](#api-documentation)
  - [Command](#command)
    - [command.run(args)](#commandrunargs)
    - [command.code(args)](#commandcodeargs)
    - [command.test(args)](#commandtestargs)
    - [command.get(args)](#commandgetargs)
    - [command.getError(args)](#commandgeterrorargs)
    - [command.read(data)](#commandreaddata)
    - [command.pipe(args)](#commandpipeargs)
    - [command.readFrom(filename)](#commandreadfromfilename)
    - [command.writeTo(args, filename)](#commandwritetoargs-filename)
    - [command.appendTo(args, filename)](#commandappendtoargs-filename)
    - [command.silent()](#commandsilent)
    - [command.relax()](#commandrelax)
    - [command.boundArgs](#commandboundargs)
    - [command.detach(args)](#commanddetachargs)
  - [shell](#shell)
    - [shell.alias(boundArgs)](#shellaliasboundargs)
    - [shell.exit(exitCode [, message])](#shellexitexitcode--message)
    - [shell.cwd()](#shellcwd)
    - [shell.cd(dir)](#shellcddir)
    - [shell.prompt(prompt [, default])](#shellpromptprompt--default)
    - [shell.lastExitCode](#shelllastexitcode)
    - [shell.pid](#shellpid)
    - [shell.env](#shellenv)
    - [shell.colors](#shellcolors)
    - [shell.nscript(nscriptFunction)](#shellnscriptnscriptfunction)
    - [shell.glob(pattern, opts)](#shellglobpattern-opts)
    - [shell.verbose(boolean)](#shellverboseboolean)
    - [shell.useGlobals()](#shelluseglobals)
    - [shell.files(dir)](#shellfilesdir)
    - [shell.isFile(path)](#shellisfilepath)
    - [shell.isDir(path)](#shellisdirpath)
    - [shell.readString(path)](#shellreadstringpath)
    - [shell.writeString(path, text)](#shellwritestringpath-text)
  - [nscript function arguments](#nscript-function-arguments)
  - [command argument expansion](#command-argument-expansion)
- [nscript CLI arguments](#nscript-cli-arguments)
- [Different ways of running `nscript` functions](#different-ways-of-running-nscript-functions)
  - [As standalone script](#as-standalone-script)
    - [Running with `nscript`](#running-with-nscript)
    - [Running standalone with `nscript`](#running-standalone-with-nscript)
    - [Running standalone with `node` (a.k.a. `local` script)](#running-standalone-with-node-aka-local-script)
    - [Running from other scripts](#running-from-other-scripts)
- [Future plans](#future-plans)
- [Comparison to other tools.](#comparison-to-other-tools)
  - [Grunt](#grunt)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introduction

`nscript` is a node.js based shell (script) interpreter which enables writing shell scripts in javascript. `nscript` is written for those that want to rely on full flexibility of shell scripts, but don't want to be bother by all the quirks of bash (or .bat) scripts. `nscript` requires no more than basic level understanding of shell scripts and javascript. `nscript` files are structured pretty similar to shell scripts, but allow you to use javascript syntax and control structures instead of the clumsy [ba/c/z]sh syntax and structures. Furthermore nscripts are highly interoperable with other javascript based development tools.

## Getting started with `nscript`

### Installing `nscript`

Install `nscript` using: `npm install -g nscript`. You might need to `sudo` this command..

<span style="font-size: 0.5em">
Since the project uses [node-gyp](https://github.com/TooTallNate/node-gyp) and [fibers](https://github.com/laverdet/node-fibers) you might need to have some [other stuff](https://github.com/TooTallNate/node-gyp#installation) installed, like XCode on mac or 'build-essential' on linux.
</span>

If you don't want to install `nscript` globally, you can still use `nscript` in your projects, see the section [Different ways of running `nscript` functions](#different-ways-of-running-nscript-functions).

### Creating and running your first script

You are now ready to create and run your first `nscript` script! To quickly start with a new script, you can use the convenient `--touch` command of nscript, but of course you can also create script manually. `nscript` scripts are just plain javascript (commonjs module) files. The `--touch` command also makes sure the script will be executable.

```
michel@miniub ~/demo $ nscript --touch myscript.js
Generating default script in 'myscript.js'
Marking script as executable: 'myscript.js'
michel@miniub ~/demo $ ./myscript.js
Hello, world!
```
The next section explains the contents of this script.

## Anatonomy of a `nscript`

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
3. `$0` is the first argument passed to this script. See the next sections for more about nscript arguments.
4. `echo` is passed into the function by `nscript` as an alias for the "echo" command. This is basically sugar for: `var echo = shell.alias("echo");`. By invoking the `echo` function, `nscript` starts the `echo` executable, and passes in the arguments provided to the function.
5. `whoami` is an alias for the "whoami" command, which returns the name of the currently logged in user (on Unix systems). The `.get()` functions grabs the standard output of a command. In this cause, the output is passed to echo. (In shell scripts, this statement would be expressed as ``echo "Hello, " `whoami` ``.

### Main `nscript` concepts

We have no seen the three most important concepts of `nscript`, which are all explained in great detail in the [API documentation](#api-documentation) section.

1. An nscript script consists of a function, called the nscript-function, that is exposed through module.exports.
2. A `shell` variable is always passed into this function by nscript as first argument. The `shell` provides a number of methods to create and invokde commands, aliases, pipes and do user interaction.
3. Executable can be invoked through command functions, which can be passed in to the nscript-function automatically.

## API Documentation

### Command

A command is function that, on invocation, starts an executable. Commands are created through the `shell.alias` function. Commands will be created automatically and injected in the the nscript function if a parameter is named after the command. For example the following two constructions are semantically equal:

```javascript
module.exports = function(shell) {
	var echo = shell.alias("echo");
	echo("hi");
}

module.exports = function(shell, echo) {
	echo("hi");
}
```

Commands might have multiple predefined arguments. For example, `gitAmend` could be defined as: `var gitAmend = shell.alias('git', 'commit', '--amend');`. For more details see [shell.alias](#shell-alias).

A command is both a function and an object with functions. Basically, `command()` is equivalent to `command.run()`.

Several API calls return empty commands, which are not bound to any executable yet, such as `shell.inputFrom` and `command.pipe`.
Bound arguments are always expanded upon command invocation, not upon creation.

Method of command are always bound to the instance, so you can safely alias methods and invoke them directly:
```javascript
var gitLog = shell.alias("git","log").get;
gitLog(); //returns the current git log
```

#### command.run(args)

Runs the command represented by this command and passes in any arguments after [processing](#nscript-command-parameters) them. The standard output and error are printed. `run` returns the exit code of executed command. By default, `run` throws an exception if the exit code is non-zero. `command.run(args)` can be written shorter as just `command(args)`.

Example:

```javascript
ls.run("-a", "*.js")
//prints: index.js test.js
//returns: 0
```

#### command.code(args)

Invokes and gets the exit code of a command. Same as `run`, but does not throw an error if the exit code is non zero. Sugar for `command.relax().run(args)`

#### command.test(args)

Invokes the command and checks whether it exited successfully. Sugar for `command.code(args) === 0`.

#### command.get(args)

Invokes the command and returns the standard output (as string) of the command instead of the exit code. Also, the standard output of the command will no longer be printed. To still read the exit status of the command, use `command.relax().get(args)` and `shell.lastExitCode()`.

Example:

```javascript
var fileNames = ls.get("-a", "*.js").split(/\n/g);
```

#### command.getError(args)

Similar to `command.get(args)` but fetches the error stream of the process instead of the standard output.

#### command.read(data)

Upon next invocation, passes `data` as standard input to the command. The data parameter can either be a string, Buffer, InputStream or file descriptor (number). Returns the command for chaining. Note that if no `read` is set for a command that reads from STDIN, the command will read user input from the shell.

Example:
```javascript
sort.read(["World", "Hello"].join("\n")).run();
//prints:
//Hello
//World
```

#### command.pipe(args)

Constructs a new, empty command. Then invokes the current command, takes the standard outputstream and passes it to the new command as standard input stream. In this way, output can be piped to other commands.

Example:
```javascript
//equivalent to shell command: ls -a | grep '.js' | sort
ls.pipe("-a").pipe("grep",".js").run("sort")
```

#### command.readFrom(filename)

Similar to read; opens the file `filename` and uses it as input for the next command invocation. Returns the command for chaining.

Example:
```javascript
//equivalent to shell command: sort < groceries.txt
sort.readFrom('groceries.txt').run();
```

#### command.writeTo(args, filename)

During the next invocation, stores the standard output of this command in a file. The argument passed to `writeTo` specifies the target filename. Returns the command for chaining.

Example:
```javascript
//shell: sort -u -b < groceries.txt > sorted_groceries.txt
sort.readFrom('grociers.txt').writeTo('sorted_groceries.txt').run('-u', '-b')
```

#### command.appendTo(args, filename)

Similar to `command.writeTo`, but appends the target file rather than replacing it.

Example:
```javascript
//shell: sort -u -b < groceries.txt > sorted_groceries.txt
sort.readFrom('grociers.txt').appendTo('sorted_groceries.txt').run('-u', '-b')
```

#### command.silent()

Suppresses the command output during the next invocation; output is no longer printed to STDOUT or STDERR. Returns the command for easy chaining.

#### command.relax()

Relaxes the execution of a command; do not throw an exception if the command exits with a non-zero exit status upon next invocation. Returns the command for easy chaining.

#### command.boundArgs

Returns an array; the original args with which this command was constructed: `shell.alias("git", "commit").boundArgs == ["git", "commit"]`

#### command.detach(args)

Same as `command.run`, but starts the process in the background, or `detached` mode. This means that nscript will continue executing without waiting for this command to finish. Also, if nscript is done and quits, the command might still be running in the background. Detach returns the process id (pid) of the spawned process.

### shell

The `shell` variable passed into the nscript function contains the following utility methods that can be used in your nscript function.

Furthermore all methods defined in `command` are available in `shell` as well. For example, `shell.test(args)` is equivalent to `shell.alias().test(args)`. Besides that, shell is a function as well, `shell(args)` is equivalent to `shell.run(args)`.

#### shell.alias(boundArgs)

An alias creates a new `command` with predefined arguments. Usually one, but there can also be many predefined arguments, or none at all.

Note that the following aliases and commands all return the same output:

```javascript
var ls = shell.alias("ls");
ls("-l", "*.js")

var ll = shell.alias("ls", "-l")
ll("*.js")

var lljs = shell.alias("ls", "-l", "*.js")
lljs();

var emptyCommand = shell.alias();
emptyCommand("ls", "-l", "*.js");
```

`nscript` injects aliases automatically for all variables that do not start with a `$` into the nscript function:
```javascript
module.exports = function(shell, echo) {
    echo("hi") //echo has been created using shell.alias('echo') automatically
}
```

#### shell.exit(exitCode [, message])

Stops the current script with the specified exit code. If a message is provided, this message is printed on the error output stream.

#### shell.cwd()

Returns the current working directory of the script. Initially, this is the directory from which the script was started, and also the current working directory of any spawned commands.

#### shell.cd(dir)

Changes the current working directory. `dir` can be relative to the current working directory, or absolute. If dir starts with `~` it is interpreted as relative to the users home directory. If no dir is passed to the `cd` function, `cd` resets to directory in which the script originally started.

#### shell.prompt(prompt [, default])

Aks the user for input. The function returns as soon as the user confirms his input with the return key. If a default value is provided, this value is returned if nothing is entered. For example:

```javascript
module.exports = function(shell, rm, $0) {
    if (prompt("Are you sure you want to remove " + $0 + "? [y/n]") == "y")
        rm("-rf", $0)
    else
        console.log("cancelled.")
}
```

#### shell.lastExitCode

Holds the exit code of the last command that was invoked. Commands that are invoked using `pipe` or `detach` will not update this property. Useful in combination `relax` and `get`. Example:

```javascript
module.exports = function(shell, grep) {
    //get all lines that contain milk
    var results = grep.relax().readFile('grociers').get('milk');
    //if there is no match, grep exits with `1` by default
    if (shell.lastExitCode !== 0)
        console.log("Don't forget the milk!")
}
```

#### shell.pid

The process id of this script, this is the same as `process.pid`.

#### shell.env

The environment variables passed by the OS to this scripts. For example `shell.env.HOME` returns "/home/michel" on my machine. This is an alias for `process.env`

#### shell.colors

Shell.colors can be used to print colored output. For example: `console.log(shell.colors.red("Print this in red"))`. For more details, check the documentation of the [colors](https://www.npmjs.com/package/colors) packages.

#### shell.nscript(nscriptFunction)

Runs a nscript function. This is convenient if you want to create local aliases, for example:

```javascript
module.exports = function(shell, echo) {
    shell.nscript(shell, whoami) {
        echo("Hello, ");
        whoami(); //prints current user name
    });
}
```

#### shell.glob(pattern, opts)

Performs file globbing on the current directory. For example: `shell.glob("**/*.js")` returns a string array of all javascript files relative to the current directory. Powered by the excellent [glob](https://www.npmjs.com/package/glob) package.

#### shell.verbose(boolean)

If set to true, `nscript` will print lots of debug input. Call `shell.verbose()` without arguments to get the current value.

#### shell.useGlobals()

If invoked, all methods and properties of `shell` will be added to the global scope. After the invocation, you can use `run(args)` instead of `shell.run(args)` for example.

#### shell.files(dir)

Returns all entries in the given `dir` as string array, relative to the current working directory.

#### shell.isFile(path)

#### shell.isDir(path)

#### shell.readString(path)

#### shell.writeString(path, text)

### nscript function arguments

An nscript function can define many parameters which will be injected by nscript upon navigation. For example given the following script `myscript.js`:

```javascript
module.exports = function(shell, cp, echo, $verbose, $r, $c, $$changeDir, $args, $1, $2) {
	//code
}
```

Based on the name of the parameters, `nscript` injects values as follows upon calling the function:

1. The first argument will always be the `shell` object, regardless the name of that variable.
2. If a parameter names starts with a dollar sign (`$`), its value will be true if a similarly named flag was provided to the script. In the example above: if the script was invoked as `./myscript.js --verbose`, the `$verbose` variable will be `true` in the script.
3. If a parameter name that starts with a dollar sign is only one character long, short options can be used, for example: `./myscript.js -rc` will make both the variables `$r` and `$c` true.
4. If a parameter name starts with a double dollar sign (`$$`), the value of the variable will hold the value of the specified parameter with which the script was invoked. For example, in `./myscript --change-dir /usr/bin` the variable `$$changeDir` will have the value `"/usr/bin"`
5. If the parameter is named `$args`, it will hold all parameters that where passed to the script that have not been matched by another flag or parameter. For example: `./myscript.js file1.txt -c --change-dir file2.txt file3.txt` will yield the value `["file1.txt", "file3.txt"]` for `$args`.
6. If the parameter is named `$0`, `$1`, ..etc, its value will be the value of the specified index in `$args`, so in the previous example, `$2` will have the value `"file3.txt"`.

`nscript` keeps parameter parsing on purpose quite simple. If you want to have more flexibility; use the `commander` or `yargs` packages, they both provide excellent and sophisticated command line arguments parsing.

### command argument expansion


`nscript` automatically expands values passed into a command, just as the shell does. For variable expansion the following rules are applied.

1. `"~"` is replaced by the home directory; `ls("~/bin")` will be translated to the actual command `ls /home/michel/bin`.
2. `"*"`, `"**"` and similar [globbing patterns](https://github.com/isaacs/node-glob#glob-primer) will be applied before invoking the command. Note that these globbing patterns are even more powerful than in most shell! `cat("**/*.js")` will translate into (for example) `cat index.js test.js lib/command.js lib/utils/test/command.js` etc etc.
3. Maps will be translated into script flags. The keys will be hyphenated. Values should be either booleans (flag present) or strings (named parameter). For example: `git("merge", { squash : false, noFf : true, m : "hi"})` will translate to `git merge --no-ff -m "hi"`
4. Arrays will be turned into flat lists, but no variable expanse will be applied to the values.
5. To pass a value literally to a command, just use an array. For example `rm("*.js")` might translate into `rm a.js b.js`, whereas `grep(["*.js"])` translates into `grep *.js` (instead of `grep a.js b.js`!)

## nscript CLI arguments

The following arguments can be passed to the `nscript` script.

* `nscript`: starts an `nscript` REPL, this is very useful for testing. (It is very similar to running `node`). All `shell` operations will be directly available on the command line.
* `nscript [filename]` will execut the specified script at `filename` and quite.
* `-h` or `--help` will print the help.
* `-V` or `--version` will print the currently installed version of `nscript`
* `-v` or `--verbose` will explain in great detail which command `nscript` is executing during a script run. Similar to callling `shell.verbose(true)` inside the script.
* `-C [path]` or `--chdir [path]` will change the working directory of the script before starting. Similar to call `shell.cd("path")` inside the script.
* `--touch [path]` create a new `nscript` file at the specified location and make it executable
* `-x <path>` make sure the nscript file at the specified location is executable. On unix, `chmod +x` will be used, in windows a similarly named `.bat` file will be created.
* `--local` in combination with --touch or -x; do not use global nscript, but the one provided in the embedding npm package



## Different ways of running `nscript` functions

### As standalone script

#### Running with `nscript`

```javacript
module.exports = function(shell) {
	shell("echo", "hello", "world");
}
```

Assuming the above script was saved as script.js:
```
$ nscript script.js
hello world
```

#### Running standalone with `nscript`

Script file:

```javacript
#!/usr/bin/nscript
module.exports = function(shell) {
	shell("echo", "hello", "world");
}
```

```
$ chmod +x script.js
$ ./script.js
hello world
```

A similar, executable standalone script can be templated by using `nscript --touch script.js`:
```
$ nscript --touch script.js
$ ./script.js
hello world
```

#### Running standalone with `node` (a.k.a. `local` script)

This option does not require `nscript` to be installed globally.

```javacript
#!/usr/bin/env node
require('nscript')(function(shell) {
	shell("echo", "hello", "world");
});
```

```
$ chmod +x script.js
$ npm install nscript --save
$ ./script.js
hello world
```

A similar, executable standalone script can be templated by using `nscript --local --touch script.js`:
```
$ npm install nscript --save
$ node node_modules/nscript  --local --touch script.js
$ ./script.js
hello world
```

#### Running from other scripts

This option does not require `nscript` to be installed globally.

```
$ npm install nscript --save
```

```javacript
require('nscript')(require('./script.js'));
```

## Future plans

1. Windows support
2. Rely on child_process.spawnSync instead of fibers for synchronous executing.

## Comparison to other tools.

### Grunt

Grunt allows for high level declaritive writing of tasks. However, spawning new jobs, grabbing there output or using pipes and stdin/ stdout streams can not be done out of the box. Luckily, `nscript` can be used from within grunt scripts as well, so feel free to combine the best of both worlds! Or feel free to write a grunt-nscript plugin ;-).



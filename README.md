# nscript

*Javascript based shell scripting for the masses*

<span style="color:red">(experimental, still under heavy development)</span>


[Jump to API Documentation](#api-documentation)

Introduction

`nscript` is a node.js based shell (script) interpreter which enables writing shell scripts in javascript. `nscript` is written for those that want to rely on full flexibility of shell scripts, but don't want to be bother by all the quirks of bash (or .bat) scripts. `nscript` requires no more than basic level understanding of shell scripts and javascript. `nscript` files are structured pretty similar to shell scripts, but allow you to use javascript syntax and control structures instead of the clumsy bash syntax and structures. Furthermore they are highly interoperable with other javascript based development tools.

## Getting started `nscript`

### Installing `nscript`

Install `nscript` using: `npm install -g nscript`. You might need sudo access for this.

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

A command is both a function and an object with functions. Basically, `command()` is equivalent to `command.run()`.

An alias is just a command with predefined arguments. Usually one, but there can also be many predefined arguments, or none at all. Note that the following aliases and commands all return the same output:

```javascript:
var ls = shell.alias("ls");
ls("-l", "*.js")

var ll = shell.alias("ls", "-l")
ll("*.js")

var lljs = shell.alias("ls", "-l", "*.js")
lljs();

var emptyCommand = shell.alias();
emptyCommand("ls", "-l", "*.js");
```

Several API calls return empty commands, which are not bound to any executable yet, such as `shell.inputFrom` and `command.pipe`.
Bound arguments are always expand upon command invocation, not upon creation.

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

#### command.input(data)

Upon next invocation, passes `data` as standard input to the command. The data parameter can either be a string, Buffer, InputStream or file descriptor (number). Returns the command for chaining. Note that if no `input` is set for a command that reads from STDIN, the command will read user input from the shell.

Example:
```javascript
sort.input(["World", "Hello"].join("\n")).run();
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

#### command.inputFrom(filename)
#### command.writeTo(args, filename)
#### command.appendTo(args, filename)

#### command.silent()

Suppresses the command output during the next invocation; output is no longer printed to STDOUT or STDERR. Returns the command for easy chaining.

#### command.relax()

Relaxes the execution of a command; do not throw an exception if the command exits with a non-zero exit status upon next invocation. Returns the command for easy chaining.

#### command.detach(args)

Same as `command.run`, but starts the process in the background, or `detached` mode. This means that nscript will continue executing without waiting for this command to finish. Also, if nscript is done and quits, the command might still be running in the background. Detach returns the process id (pid) of the spawned process.




### Shell

### nscript function arguments

### nscript command parameters

## `nscript` interactive shell

## Future plans

## Different ways of running `nscript` functions

### As standalone script

#### Running with `nscript`

#### Running with `node` (a.k.a. `local` script)

#### Running from other scripts

## Comparison to other tools.

### Grunt

Grunt allows for high level declaritive writing of tasks. However, spawning new jobs, grabbing there output or using pipes and stdin/ stdout streams can not be done out of the box. Luckily, `nscript` can be used from within grunt scripts as well, so feel free to combine the best of both worlds! Or feel free to write a grunt-nscript plugin ;-).

# Getting started


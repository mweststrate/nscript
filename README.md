# nscript (experimental, still under heavy development)

*Javascript based shell scripting for the masses*

[Jump to API Documentation](#api-documentation)

Introduction

`nscript` is a node.js based shell (script) interpreter which enables writing shell scripts in javascript. `nscript` is written for those that want to rely on full flexibility of shell scripts, but don't want to be bother by all the quirks of bash (or .bat) scripts. `nscript` requires no more than basic level understanding of shell scripts and javascript.

## Getting started `nscript`

### Installing `nscript`

### Running hello world

## Anatonomy of a `nscript` function


## API Documentation

### nscript `commands`

### nscript `shell`

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

Install `nscript` using: `npm install -g nscript`. You might need sudo access for this.

Since the project uses [node-gyp](https://github.com/TooTallNate/node-gyp) and [fibers](https://github.com/laverdet/node-fibers) you might need to have some [other stuff](https://github.com/TooTallNate/node-gyp#installation) installed, like XCode on mac or 'build-essential' on linux.

You are now ready to create and run your first `nscript` script!

Store the follow snippet to `myscript.js`:

```javascript
#!/usr/bin/nscript
module.exports = function(nscript, echo, whoami) {
	echo("Hello ", whoami().out);
}
```

Now run `nscript myscript.js`. It will print:

```
$ nscript myscript.js
Hello michel
```

Or, you could make it executable as well (on Linux/Mac) using `chmod +x myscript.js` and execute it using `./myscript.js`

## Making executable scripts

You can make the script self runnable by simply marking it as executable (`chmod +x myscript.js`) and adding a 'shebang' on the first line. The first line should read: `#!nscript`

## Running scrips without global `nscript`

If you don't want to instal nscript globally, but have nscript installed to your project using `npm install nscript`, you can start a nscript script as follows:

```javascript
require("nscript")(function(shell, echo, whomai) {
	echo("Hello ", whoami().out);
})
```
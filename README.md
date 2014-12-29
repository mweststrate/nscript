# nscript

## Javascript based shell scripting for the masses

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
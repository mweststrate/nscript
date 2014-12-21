# jsdo

## Javascript based shell scripting for the masses

# Getting started

Install `jsdo` using: `npm install -g jsdo`. You might need sudo access for this.

Since the project uses [node-gyp](https://github.com/TooTallNate/node-gyp) and [fibers](https://github.com/laverdet/node-fibers) you might need to have some [other stuff](https://github.com/TooTallNate/node-gyp#installation) installed, like XCode on mac or 'build-essential' on linux.

You are now ready to create and run your first `jsdo` script!

Store the follow snippet to `myscript.js`:

```javascript
exports = function(jsdo, echo, whoami) {
	echo("Hello ", whoami().out);
}
```

Now run `jsdo myscript.js`. It will print:

```
$ jsdo myscript.js
Hello michel
```

## Making executable scripts

You can make the script self runnable by simply marking it as executable (`chmod +x myscript.js`) and adding a 'shebang' on the first line. The first line should read: `#!jsdo`

## Running scrips without global `jsdo`

If you don't want to instal jsdo globally, but have jsdo installed to your project using `npm install jsdo`, you can start a jsdo script as follows:

```javascript
require("jsdo").runScript(function(jsdo, echo, whomai) {
	echo("Hello ", whoami().out);
})
```
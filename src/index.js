#!/usr/bin/env node
/*
 * nscript: javascript shell scripts for the masses
 *
 * (c) 2014 - Michel Weststrate
 */
/* GLOBAL exports,module */

var Fiber = require('fibers');
var path = require('path');
var utils = require('./utils.js');
var program = require('commander');
var fs = require('fs');

/**
 * Runs a function using nscript. Params will be aliased @see nscript.alias based on their name, except for the first one, which will be replaced by nscript itself.
 * @param  {function} func
 */
var runNscriptFunction = module.exports = function(func) {
	//parse and args

	if (typeof func !== "function")
		throw "Not a function: " + func + ", the script file should be in the form 'module.exports = function(shell) { }'";
	var args = utils.extractFunctionArgumentNames(func);
	args = injectArguments(args, [].concat(scriptArgs));
	args[0] = shell;
	//invoke
	new Fiber(function() {
		func.apply(null, args);
		if (shell.verbose())
			console.log("Finished in " + process.uptime() + " seconds");
	}).run();
};

/*
 * Local imports after defining module.exports
 */
var shell = require('./shell.js');
var repl = require('./repl.js');
var scriptArgs = process.argv.slice(2); //remove node, scriptfile

var injectArguments = runNscriptFunction.injectArguments = function(argNames, varArgs) {
	var argValues = new Array(argNames.length);
	var secondPass = false;
	var validOptions = [path.basename(process.argv[2])];
	var argsRequired = -1;
	var parseParams = !!argNames.filter(function(x){return x.indexOf("$") === 0 }).length;

	//TODO: support predefined --verbose --change-dir --help --version
	function onArg(argName, index) {
		var idxMatch = argName.match(/^\$(\d+)$/);
		var paramMatch = argName.match(/^\$\$([A-Za-z0-9_-]+)$/);
		var flagMatch = argName.match(/^\$([A-Za-z0-9_-]+)$/);
		var paramName, idx;

		//always pass in shell as first
		if (index === 0) {
			if (secondPass)
				argValues[index] = shell;
		}
		//$args returns all remaining args
		else if (argName === "$args") {
			if (secondPass)
				argValues[index] = varArgs;
		}
		//$3 returns the 3th vararg
		else if (idxMatch) {
			if (secondPass)
				argValues[index] = varArgs[idxMatch[1]];
			else
				argsRequired = Math.max(argsRequired, idxMatch[1]);
		}
		//$$myArg should parse --my-arg value
		else if (paramMatch) {
			if (!secondPass) {
				paramName = utils.hyphenate(paramMatch[1]);
				validOptions.push("[" + paramName + " <value>]");
				idx = varArgs.indexOf(paramName);
				if (idx != -1) {
					if (idx >= varArgs.length - 1)
						throw "Missing a value for option " + paramName;
					argValues[index] = varArgs[idx + 1];
					varArgs.splice(idx, 2);
				}
			}
		}
		//$myFlag should parse --my-flag to true
		else if (flagMatch) {
			if (!secondPass) {
				paramName = utils.hyphenate(flagMatch[1]);
				validOptions.push("[" + paramName + "]");
				idx = varArgs.indexOf(paramName);
				argValues[index] = idx != -1;
				if (idx != -1)
					varArgs.splice(idx, 1);
			}
		}
		else if (argName.indexOf('$') === 0)
			throw "Invalid parametername in nscript function: '" + argName + "', please check the nscript docs for valid parameter names";
		else if (secondPass)
			argValues[index] = shell.alias(argName);
	}

	varArgs = utils.normalizeCliFlags(varArgs);

	//parse all params and flags
	argNames.forEach(onArg);
	for(var i = 0; i <= argsRequired; i++)
		validOptions.push("[arg]");
	if (parseParams)  {
		//remaining values should not be flags
		varArgs.forEach(function(arg) {
			//script variadic argument values should not start with a hyphen. Rly? yeah, try to touch or git add a file named '-p' for exampe :-P
			if (arg.indexOf("-") === 0)
				throw "Invalid option '" + arg + "'. \nUsage: " + validOptions.join(" ");
		});
		//TODO: don't chekc args required? -> $$0 makes are mandatory, in contrast to $0
		//if (varArgs.length <= argsRequired)
		//	throw "Missing arguments. Expected at least " + (argsRequired + 1) + " argument(s), found: '" + varArgs.join(' ') + "'";
	}
	//variadic arguments can only be determined reliable after parsing the named args
	secondPass = true;
	argNames.forEach(onArg);

	return argValues;
};

/**
 * Runs a file that contains a nscript script
 * @param  {string} scriptFile
 */
function runScriptFile(scriptFile)  {
	//node gets the node arguments, the nscript arguments and the actual script args combined. Slice all node and nscript args away!
	scriptArgs = scriptArgs.slice(scriptArgs.indexOf(scriptFile) + 1);
	if (shell.verbose())
		console.log("Starting nscript " + scriptFile + scriptArgs.join(" "));

	runNscriptFunction(require(path.resolve(process.cwd(), scriptFile))); //nscript scripts should always export a single function that is the main
}

function touchScript(scriptFile, local) {
	if (fs.existsSync(scriptFile))
		throw "File '" + scriptFile + "' already exists";
	console.log("Generating default script in '" + scriptFile + "' " + (local?"[using local nscript]":""))
	var demoFunc = [
		"function(shell, echo, $0) {",
		"\t/* This script is powered by 'nscript', see the docs at https://github.com/mweststrate/nscript */",
		"\techo(\"Hello\", $0 || \"world\")",
		"}"
	].join("\n");
	shell.writeString(
		scriptFile,
		local ? "require(nscript)(" + demoFunc + ")" : "module.exports = " + demoFunc
	);
	makeExecutable(scriptFile, local);
}

function makeExecutable(scriptFile, local) {
	if (!fs.existsSync(scriptFile))
		throw "Filed doesn't exist: " + scriptFile;
	if (process.platform === 'windows') {
		console.log("Generating executable script in '" + scriptFile + ".bat' " + (local?"[using local nscript]":""))
		shell.writeTo(scriptFile + ".bat", (local ? "node " : "nscript ") + path.basename(scriptFile) + " %+");
	}
	else {
		console.log("Marking script as executable: '" + scriptFile + "' " + (local?"[using local nscript]":""))
		shell.nscript(function(shell, cp, chmod, rm, echo, cat) {
			var contents = shell.readString(scriptFile);
			if (contents[0] != '#' || contents[1] != '!')
				contents = (local ? "#!/usr/bin/env node\n" : "#!/usr/bin/nscript\n") + contents;
			shell.writeString(scriptFile, contents);
			chmod("+x", scriptFile);
		});
	}
}

var version = exports.version = require('../package.json').version;

if (!module.parent) {
	program
		.version(version)
		.usage('[options] <file>')
		.option('-C, --chdir <path>', 'change the working directory')
		.option('-v, --verbose', 'start in verbose mode')
		.option('--touch <path>', 'create a new nscript file at the specified location and make it executable')
		.option('-x <path>', 'make sure the nscript file at the specified location is executable')
		.option('--local', 'in combination with --touch or -x; do not use global nscript, but the one provided in the embedding npm package');

	program.parse(process.argv);

	if (program.chdir)
		shell.cd(program.chdir);
	if (program.verbose)
		shell.verbose(true);

	if (program.touch)
		touchScript(program.touch, program.local);
	else if (program.X) //MWE: unsure why X is upercased here...
		makeExecutable(program.X, program.local);
	else if (process.argv.length > 2) {
		var script = program.args[0];
		try {
			runScriptFile(script);
		}
		catch (e) {
			if (shell.verbose())
				throw e; //propage exception to the console for stack
			else
				console.error("" + e);
			process.exit(8); //same as node exceptions
		}
	}
	else {
		shell.useGlobals();
		repl.start();
	}
}
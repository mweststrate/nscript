#!jash

//jash or js2
exports = function(shell, exec, cp, cf) {
	shell.require(3); //3 non flagged arguments
	shell.require("--bla"); //--bla should be a string

	shell.exit(3)
	shell.prompt("ask something");

	ls("*") //returns status code
	ls.get("*") //returns stdout
	ls.getLines(offset, limit/offsetend)("*")
	ls.withLines(callback)()
	ls.writeTo("*", "output.txt");
	ls.appendTo("*", "output.txt");
	cat.input(ls.pipe("*")); //pipe ls to cat
	ls.pipe("*")("cat"); //picks up the pipe
	ls.input("string/buffer/stream")("*");
	ls.input("string/buffer/stream").get("*");
	ls.inputFile("input.txt")("*");
	ls.test("*") //returns true if code == 0
	ls.code("*") //returns status code
	ls.detach("*") //run in bg, returns pid

	//Toggles
	shell.silent(), //TODO: part of a command, not global
	shell.verbose()

	shell.useGlobals(); //create global functions

	shell.cwd();
	shell.cd(); //empty resets to begin dir
	var ls = shell.wrap("ls");

	shell.pid;

	shell.args; //array + map
	shell.args.x; //returns string value or true
	shell.env.x; //

	require('shell/globals')

	cat("a", "b");

	shell.exec("ln -a")
	shell.run("ln", "-a")
	//
	shell.parseColumns(stringOrArray)
	shell.parseFixedWidthColumns
	shell.setColumnNames

	//Globbing:
	cat("*.js"); //expand then quote
	cat("**.js");
	cat(quote("dot*js")); //or: cat(["dot*js"])
	cat(myvarname variable)
}

//TODO

// # Initial version (.1)
// 1. -implement repl / prompt-
// 1. -implement run methods (shell script, node script)-
// 1. tests
// 1. -make exec sync and script work-
// 2. -pipe, read, writeto-
// 4. -file matching shell.findFiles("src/**/.js*")- // shell.glob
// 5. -colors-
// 6. yargs
// 6. top level globals?
// 6. nscript this = shell instead of first argument?
// 6. rename src/ -> lib/
// 7. publish 'nscript/shell'
// 1. -rename (jsrun / jsr) ?-
// 1. move test/scripts to demo/
// 5. improve logging, use stderr.
// 1. .npm ignore
// 1. generated docs
// 1. windows support
// 1. catch EACCESS errors: file not found ornot executable
// 1. create instantiate and link nscript based shell scripts
//
// # Later versions prip
// 3. fileUtils isFile, isDir, isExecutable, newer(), older(), outdated()
// 7. grunt plugins?
// 1. autocomplete for files & commands
// 1. grabchars/ promptChar

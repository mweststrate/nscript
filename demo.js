#!jash

//jash or js2
exports = function(jsDo, exec, cp, cf) {
	jsDo.require(3); //3 non flagged arguments
	jsDo.require("--bla"); //--bla should be a string

	jsDo.exit(3)
	jsDo.prompt("ask something");

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
	jsDo.silent(), //TODO: part of a command, not global
	jsDo.verbose()

	jsDo.useGlobals(); //create global functions

	jsDo.cwd();
	jsDo.cd(); //empty resets to begin dir
	var ls = jsDo.wrap("ls");

	jsDo.pid;

	jsDo.args; //array + map
	jsDo.args.x; //returns string value or true
	jsDo.env.x; //

	require('jsdo/globals')

	cat("a", "b");

	jsdo.exec("ln -a")
	jsdo.run("ln", "-a")
	//
	jsdo.parseColumns(stringOrArray)
	jsdo.parseFixedWidthColumns
	jsdo.setColumnNames

	//Globbing:
	cat("*.js"); //expand then quote
	cat("**.js");
	cat(quote("dot*js")); //or: cat(["dot*js"])
	cat(myvarname variable)
}

// 1. make exec sync and script work
// 2. pipe, read, writeto
// 3. fileUtils isFile, isDir, isExecutable, newer(), older(), outdated()
// 4. file matching jsDo.findFiles("src/**/.js*") // jsDo.findDirs
// 5. colors
// 6. yargs
// 7. grunt plugins?
// pass expression into 'jsdo'
// run as REPL
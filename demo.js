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
	ls.writeTo("*", "output.txt");
	ls.appendTo("*", "output.txt");
	ls.pipe("*"); cat(); //picks up the pipe
	ls.pipe("*")("cat"); //picks up the pipe
	ls.input("string/buffer/stream")("*");
	ls.input("string/buffer/stream").get("*");
	ls.inputFile("input.txt")("*");
	ls.test("*") //returns true if code == 0
	ls.code("*") //returns status code

	jsDo.pid;
	jsDo.args; //array + map
	jsDo.args.x; //returns string value or true
	jsDo.env.x; //
	jsDo.cwd();
	jsDo.cd(); //empty resets to begin dir
	var ls = jsDo.wrap("ls");

	//Toggles
	jsDo.silent(), verbose()

	jsDo.useGlobals(); //create global functions
	require('jsdo/globals')

	cat("a", "b");

	jsdo.exec("ln -a")
	jsdo.run("ln", "-a")
	//
	jsdo.parseColumns(stringOrArray)
	jsdo.parseFixedWidthColumns
	jsdo.setColumnNames
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
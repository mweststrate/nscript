#!jash

//jash or js2
exports = function(jsDo, exec, cp, cf) {
	jsDo.require(3); //3 non flagged arguments
	jsDo.require("--bla"); //--bla should be a string

	jsDo.code() //last error code
	jsDo.exit(3)
	jsDo.prompt("ask something");

	ls("*").out
	ls("*").err
	ls("*").code

	ls("*").writeTo(file)
	ls("*").appendTo(file)
	ls("*") === 3;

	jsDo.withInput("bla"/*stream, buffer, or file or string err..? */); ls('*');

	jsDo.pid;
	jsDo.args; //array + map
	jsDo.args.x; //returns string value or true
	jsDo.env.x; //
	jsDo.cwd();
	jsDo.cwd(path);
	var ls = jsDo.wrap("ls");

	//Toggles
	jsDo.silent(), verbose(), failFast()

	cat("a", "b");

	jsdo.exec("ln -a")
	jsdo.run("ln", "-a")
	//pipes
	jsDo.pipe();
	//detach..
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
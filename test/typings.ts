/// <reference path="../nscript.d.ts" />

// Test the typing structure using
// tsc test/typings.ts -m commonjs
// this script is not really executable

import nscript = require('nscript');

nscript((shell:Shell, $flag:boolean, ls:Command) => {
	ls.test("/");
	ls.spawn().append("out.txt").wait();
	shell.run("echo", { n: true }, ["unexpanded"], "expanded");
});
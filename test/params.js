var utils = require('../src/utils.js');
var nscript = require('../src/index.js');
var shell = require('../src/shell.js');
var tail = utils.tail;
var spawn = require('../src/spawn.js');

/**
 * This file tests several utility functions to glob, parse args, expand arguments etc.
 */

exports.testExpandArguments = function(test) {
	var e = spawn.expandArguments;
	test.deepEqual(e(["hoi"]), ["hoi"]);
	test.deepEqual(e(["*.json"]), ["package.json"]);
	test.deepEqual(e([["*.json"]]), ["*.json"]);
	//TODO: replace michel with user
	test.deepEqual(e(["~/.pro*"]), ["/home/michel/.profile"]);
	test.deepEqual(e([{
		a: true,
		b: false,
		c: "hallo",
		d: "*.json",
		E: true,
		abc: "hi",
		abCd: 3,
		abCde: true
	}]), ["-a","-c", "hallo", "-d", "package.json", "-E", "--abc","hi","--ab-cd","3", "--ab-cde"]);
	test.done();
};

exports.testHyphenate = function(test) {
	var h = utils.hyphenate;
	test.equals(h("v"), "-v");
	test.equals(h("V"), "-V");

	test.equals(h("verbose"), "--verbose");
	test.equals(h("Verbose"), "--Verbose");
	test.equals(h("verBose"), "--ver-bose");
	test.equals(h("ver-Bose"), "--ver-Bose");
	test.equals(h("v_e$b_$_-e-r"), "--v-e-b-e-r");

	test.done();
};

exports.testNormalizeFlags = function(test) {
	var n = utils.normalizeCliFlags;
	test.deepEqual(n(["abc", "-abc", "def","--gh"]), ["abc", "-a", "-b", "-c", "def","--gh"]);
	test.done();
};

exports.testInjection = function(test) {
	var i = nscript.injectArguments;
	test.deepEqual(i([],[]), []);
	test.deepEqual(i(["x"],[]), [shell]); //arg 0 is always the shell
	test.ok(typeof i(["bla","echo"],[])[1] === "function"); //cd should be wrapped
	test.ok(typeof i(["bla","cd"],[])[1] === "function"); //cd should be wrapped
	test.done();
};

exports.testParamInjection = function(test) {
	function i() {
		return tail(nscript.injectArguments.apply(null, arguments));
	}
	try {
		debugger;
		test.deepEqual(i(["x","$bla"], ["--bla"]), [true]);
		test.deepEqual(i(["x","$$bla"], ["--bla", "boe"]), ["boe"]);
		test.deepEqual(i(["x","$$bla"], ["--bla", "--boe"]), ["--boe"]);
		test.deepEqual(i(["x","$0"], ["bla"]), ["bla"]);
		test.deepEqual(i(["x","$args"], ["bla"]), [["bla"]]);
		test.deepEqual(i(["x","$v"], ["-v"]), [true]);
		test.deepEqual(i(["x","$v", "$a", "$U"], ["-Uva"]), [true, true, true]);
		test.deepEqual(i(["x","$veryVerbose", "$a"], ["--very-verbose","-a"]), [true, true]);
		test.deepEqual(i(["x","$$veryVerbose", "$a","$args"], ["--very-verbose","-a"]), ["-a", false,[]]);
		test.deepEqual(i(["x","$args", "$$VeryVerbose", "$a"], ["--Very-verbose","-a"]), [[], "-a", false]);
	//	test.deepEqual(i(["x","$args", "$$veryVerbose", "$a"], ["bla", "--very-verbose","-a", "hoi", "hi"]), [["bla", "hoi", "hi"], "-a", false]);
		test.deepEqual(i(["x", "$$a", "$b", "$args", "$1", "$c"],["hi", "-ba", "boe", "bi"]), ["boe", true, ["hi", "bi"], "bi", false]);

		try {
			i(["x", "$$a", "$boe"], ["--boe", "--bla"]);
			test.fail("Expected exception");
		}
		catch (e) {
			//TODO: fix script name, should not be present in this case?
			test.equal(e, 'Invalid option \'--bla\'. \nUsage: test [-a <value>] [--boe]');
		}
	/*	try {
			console.log('test');
			i(["x", "$$a", "$boe","$0","$1"], ["--boe","blie"]);
			test.fail("Expected exception");
		}
		catch (e) {
			console.log('xx');
			test.equal(e, "Missing arguments. Expected at least 2 argument(s), found: 'blie'");
		}
	*/	try {
			i(["x", "$$a"], ["-a"]);
			test.fail("Expected exception");
		}
		catch (e) {
			test.equal(e, 'Missing a value for option -a');
		}

		test.done();
	}
	catch(e) {
		console.error(e);
		console.log(e.stack);
		throw e;
	}
};
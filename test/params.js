var utils = require('../src/utils.js');
var nscript = require('../src/index.js');
var shell = require('../src/shell.js');
var tail = utils.tail;

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
	test.deepEqual(i(["x","$bla"], ["--bla"]), [true]);
	test.deepEqual(i(["x","$$bla"], ["--bla"]), [undefined]);
	test.deepEqual(i(["x","$$bla"], ["--bla", "boe"]), ["boe"]);
	test.deepEqual(i(["x","$$bla"], ["--bla", "--boe"]), ["--boe"]);
	test.deepEqual(i(["x","$0"], ["bla"]), ["bla"]);
	test.deepEqual(i(["x","$args"], ["bla"]), [["bla"]]);
	test.deepEqual(i(["x","$v"], ["-v"]), [true]);
	test.deepEqual(i(["x","$v", "$a", "$U"], ["-Uva"]), [true, true, true]);
	test.deepEqual(i(["x","$veryVerbose", "$a"], ["--very-verbose","-a"]), [true, true]);
	test.deepEqual(i(["x","$$veryVerbose", "$a","$args"], ["--very-verbose","-a"]), ["-a", false,[]]);
	test.deepEqual(i(["x","$args", "$$VeryVerbose", "$a"], ["--Very-verbose","-a"]), [[], "-a", false]);
	test.deepEqual(i(["x","$args", "$$veryVerbose", "$a"], ["bla", "--very-verbose","-a", "hoi", "hi"]), [["bla", "hoi", "hi"], "-a", false]);
	test.deepEqual(i(["x", "$$a", "$b", "$args", "$1", "$c"],["hi", "-ba", "boe", "bi"]), ["boe", true, ["hi", "bi"], "bi", false]);

	try {
		i(["x", "$$a", "$boe"], ["--boe", "--bla"]);
		test.fail("Expected exception");
	}
	catch (e) {
		test.equal(e, 'Invalid option \'--bla\'. Valid options are: -a [value], --boe');
	}
	try {
		console.log('test');
		i(["x", "$$a", "$boe","$0","$1"], ["--boe","blie"]);
		console.log('xx');

		test.fail("Expected exception");
	}
	catch (e) {
		console.log('xx');
		test.equal(e, "Missing arguments. Expected at least 2 argument(s), found: 'blie'");
	}

	test.done();
};
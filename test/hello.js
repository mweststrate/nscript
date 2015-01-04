var nscript = require('../src/index.js');
var shell = require('../src/shell.js');
var Fiber = require('fibers');

exports.hello1 = function(test) {
	debugger;
	test.equals(shell.get('test/scripts/hello1.js').trim(), 'hello world');
	test.equals(shell.get('test/scripts/hello2.js').trim(), 'hello world');
	test.equals(shell.get('nscript', 'test/scripts/hello1.js').trim(), 'hello world');
	test.equals(shell.get('node', 'test/scripts/hello2.js').trim(), 'hello world');

	test.done();
}


//wrap in fiber
for (var key in exports) {
	var f = exports[key];
	exports[key] = function(test) {
		new Fiber(function() {
			f(test);
		}).run();
	}
}
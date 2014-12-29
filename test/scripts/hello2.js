#!/usr/bin/env node
require('../../src/index.js')(function(shell) {
	shell.run('echo', 'hello', 'world');
});
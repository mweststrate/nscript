#!/usr/bin/env node
require('../../lib/index.js')(function(shell) {
	shell.run('echo', 'hello', 'world');
});
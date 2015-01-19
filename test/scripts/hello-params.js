#!/usr/bin/nscript
module.exports = function(shell, $$greeting, $0, echo) {
	echo($$greeting || "hello", $0);
};
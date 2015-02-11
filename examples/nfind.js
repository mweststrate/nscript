#!/usr/bin/nscript
// A nscript script is just a function exposed by a CommonJS module
// This script has multiple arguments, the search query, and optional --dir and --file-type flags:
// Usage: nfind.js [--dir DIRECTORY] [--file-type EXTENSION] [SEARCH QUERY]
// Example usage: ./nfind.js --file-type js TODO
module.exports = function(shell, grep, $$fileType, $$dir, $0) {
	// change search directory of the script if --dir is provided
	if ($$dir)
		shell.cd($$dir);
	// run grep. Grep fails if it doesn't find anything, so test the return value
	if (!grep.test(
		// grep options: F: take search literal, i: case insensitive, n: show line numbers
		{ F: true, i: true, n: true },"--color=auto",
		// pass in the search query literally using brackets. Prompt for a search query if not set
		[$0 || shell.prompt('Please enter your search text:')],
		// apply the filter. nscript expands asterixes automatically
		$$fileType ? '**/*.'+ $$fileType : '**/*',
		'/dev/null'
	)) {
		console.log("No matches found for '" + $0 +"'");
	}
};
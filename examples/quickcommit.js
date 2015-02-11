#!/usr/bin/nscript
// quickcommit.js - example nscript that commits the current working tree and pushes it to origin
// An nscript is just a commonJS module that exports a single function.
// This script uses the 'git' command, and accepts one parameter, the commit message which can be provided using the '-m' flag
module.exports = function(shell, git, grep, $$m) {
	//run 'git branch' to extract the current branchname (which is highlighted with an asterix)
	var branchName = git.spawn('branch').pipe(grep,['*']).getLines()[0].substring(2).trim();

	//commit all modified files. Ask for a commit message if none was provided
	git('commit', {
		all: true,
		message: $$m || shell.prompt("About to commit on branch '" + branchName + "'. Please enter a commit message:")
	});

	//rebase our checked out branch on the latest remote commits
	git('fetch');
	git('rebase','origin/' + branchName);

	//finally, push
	git('push');
};
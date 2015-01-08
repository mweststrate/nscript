#!/usr/bin/nscript
/* Publish.js */
module.exports = function(shell, npm) {
	var package = require('package.json');
	if (shell.prompt("Are you sure you want to publish " + package.name + " version " + package.version + " to the NPM package repository? [y/n]") === "y") {
		if (npm.test("info", package.name)) {
			//package is registered in npm
			var publishedPackageInfo = JSON.parse(npm.get("info", package.name));
			if (publishedPackageInfo.versions == package.version || publishedPackageInfo.versions.indexOf(package.version) != -1) {
				console.error("Version " + package.version + " is already published to npm")
				shell.exit(1);
			}
		}
		npm("publish");
		console.log("Published!")
	}
	else
		console.log("Cancelled")
}
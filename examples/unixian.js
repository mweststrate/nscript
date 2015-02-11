#!/usr/bin/nscript
module.exports = function(shell, echo, $beard) {
  if ($beard)
    echo("Awesome, you invoked this script with --beard. You probably are an unixian.");
  else if (shell.prompt("Do you have a mustache at least?","y") === "y")
    echo("Welcome, oh hairy ", shell.env.USER);
  else
    shell.exit(1, "Epic fail.");
};
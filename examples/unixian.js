#!/usr/bin/nscript
module.exports = function(shell, echo, $beard) {
  var hasMustache;
  if ($beard)
    echo("Awesome, you invoked this script with --beard. You probably have one.");
  else
    hasMustache = shell.prompt("Do you have a mustache at least?","y") == "y";
  if (!$beard && !hasMustache)
    shell.exit(1, "Epic fail.");
};
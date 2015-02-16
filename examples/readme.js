#!/usr/bin/nscript
module.exports = function(shell, grep, ls, cat, echo, gedit, sort, whoami) {

  // run a command
  // bash: echo hello world
  echo("hello","world")

  // use shell expansions
  // bash: echo src/*.js
  echo("lib/*.js")

  // or, to display all files recusively in lib/
  cat("lib/**/*.js")

  // prevent shell expansion
  // bash: echo 'lib/*.js'
  echo(["lib/*.js"])

  // obtain output
  var result = echo.get("hello","world")

  // nest commands
  // bash: echo hello `whoami`
  echo("hello", whoami.get())

  // check exit status
  // bash: echo hello world; echo $?
  var exitCode = echo.code("hello","world")

  // supress output
  // bash: ls > /dev/null
  ls.silent().run()

  // write output to file
  // bash: ls > dir.txt
  ls.write('test/tmp/dir.txt')

  // append output to file
  // bash: ls >> dir.txt
  ls.append('test/tmp/dir.txt')


  // pipe data into a process
  // bash: echo "pears\napples" | sort
  sort.input("pears\napples").run()

  // prompt for input
  // bash: echo -n "Your age? "; read $AGE
  var age = shell.prompt("Your age?")

  // start a process in the background
  // bash: gedit test/groceries.txt &
  gedit.detach("test/groceries.txt")

  // pipe processes
  // bash: cat test/groceries.txt | grep '.js' | sort -i
  var sortedMilks = cat.args("test/groceries.txt").pipe(grep,"milk").pipe(sort,"-i").get()

  // read input from file and to file
  // bash: grep milk < groceries.txt > milksonly.txt
  grep.read('test/groceries.txt').args('milk').write('test/tmp/milksonly.txt')

  // spawn() provides fine grained input / output control append standard error to file
  // bash: ls *.js 2>> errors.txt | sort -u
  ls.args("lib/*.js").spawn().appendError('test/tmp/errors.txt').pipe(sort, "-u").wait()
}
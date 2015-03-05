interface Shell {
	pid: number;
	env: {[key:string]:string};
	colors:any; // See node module colors
	glob(pattern:string,opts?:Object):string[];
	lastExitCode: number;
	future:any; // See node-fibers module
	nscript(nscriptFunction:NscriptFunction, callback:(err:any,returnValue:any)=>void);

	alias(...args:CommandArg[]):Command;
	cmd(...args:CommandArg[]):Command;
	exit(status?:number, message?:string);
	prompt(promt:string, defaultValue?:string):string;

	verbose(verboseMode:boolean);
	useGlobal();

	cwd():string;
	pwd():string;
	cd(newPath?:string);

	isFile(filename:string):boolean;
	isDir(path:string):boolean;
	files(path:string):string[];

	write(filename:string, text:string);
	append(filename:string, text:string);
	read(filename:string):string;

	/* Wrappers of command */
	run(...args:CommandArg[]):number;
	code(...args:CommandArg[]):number;
	test(...args:CommandArg[]):boolean;
	get(...args:CommandArg[]):string;
	getError(...args:CommandArg[]):string;
	getLines(...args:CommandArg[]):string[];
	detach(...args:CommandArg[]):number;
	spawn(...args:CommandArg[]):SpawnedCommand;
}

interface Command {
	options(optionsOfNewCommand:CommandOptions):Command;
	args(...args:CommandArg[]):Command;
	argsSplat(args:CommandArg[]):Command;
	silent():Command;
	relax():Command;
	env(key:string,value:string):Command;
	env(envVariables:{[key:string]:string;}):Command;

	spawn():SpawnedCommand;

	/* Wrappers of SpawnedCommand */
	(...args:CommandArg[]):number;
	run(...args:CommandArg[]):number;
	code(...args:CommandArg[]):number;
	test(...args:CommandArg[]):boolean;
	get(...args:CommandArg[]):string;
	getError(...args:CommandArg[]):string;
	getLines(...args:CommandArg[]):string[];

	input(fd:number):Command;
	input(readable:{pipe:Function;}):Command;
	input(data:string):Command;
	read(filename:string):Command;

	pipe(cmd:Command|string, ...args:CommandArg[]):Command;
	write(filename:string):number;
	append(filename:string):number;
	detach(...args:CommandArg[]):number;

	writeError(filename:string):SpawnedCommand;
	appendError(filename:string):SpawnedCommand;
}

interface CommandOptions {
	silent?:boolean;
}

interface SpawnedCommand {
	pid: number;
	process: any;
	get():string;
	getError():string;
	getLines():string[];
	pipe(cmd:Command|string, ...args:CommandArg[]):SpawnedCommand;
	write(filename:string):SpawnedCommand;
	append(filename:string):SpawnedCommand;
	writeError(filename:string):SpawnedCommand;
	appendError(filename:string):SpawnedCommand;
	wait():number;
	test():boolean;
	code():number;
	onClose(cb:(status:number)=>void):SpawnedCommand;
	onOut(cb:(line:string)=>void):SpawnedCommand;
	onError(cb:(line:string)=>void):SpawnedCommand;
}

interface NscriptFunction {
	(shell:Shell, ...injectedArgs:NscriptArg[]):any;
}

declare type CommandArg = string | {[flag:string]:string|boolean}	| string[];

declare type NscriptArg = string | boolean | Command;

declare function nscript(
	nscriptFunction:NscriptFunction,
	callback?:(error:any,returnValue:any)=>void
);

declare module "nscript" {
	export = nscript;
}

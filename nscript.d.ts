declare module "nscript" {

	export interface Shell {

	}

	export interface Command {
		options(optionsOfNewCommand:CommandOptions):Command;
		args(...args:CommandArg[]):Command;
		argsSplat(args:CommandArg[]):Command;
		silent():Command;
		relax():Command;
		env(key:string,value:string):Command;
		env({[key:string]:string}):Command;

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

		pipe(...args:CommandArg[]):Command;
		write(filename:string):number;
		append(filename:string):number;
		detach(...args:CommandArg[]):number;

		writeError(filename:string):SpawnedCommand;
		appendError(filename:string):SpawnedCommand;
		spawn():SpawnedCommand;

	}

	export interface CommandOptions {
		silent?:boolean;
	}

	export interface SpawnedCommand {
		pid: number;
		process: any;
		get():string;
		getError():string;
		getLines():string[];
		pipe(...args:CommandArg[]):SpawnedCommand;
		write(filename:string):SpawnedCommand;
		append(filename:string):SpawnedCommand;
		writeError(filename:string):SpawnedCommand;
		appendError(filename:string):SpawnedCommand;
		wait():number;
		test():boolean;
		code():number;
		onClose((status:number)=>void):SpawnedCommand;
		onOut((line:string)=>void):SpawnedCommand;
		onError((line:string)=>void):SpawnedCommand;
	}

	export interface NscriptFunction {

	}

	export interface CommandArg {

	}

}

declare function nscript(nscriptFunction:NscriptFunction)
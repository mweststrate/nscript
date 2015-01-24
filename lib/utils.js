var util = require('util');

exports.toArray = function(args) {
	var res = [];
	for (var i = 0; i < args.length; i++)
		res.push(args[i]);
	return res;
};

exports.extend = function(base) {
	for (var i = 1; i < arguments.length; i++) {
		var src = arguments[i];
		for (var key in src) if (src.hasOwnProperty(key))
			base[key] = src[key];
	}
	return base;
};

/**
 * Given a function, returns an array of the (formal) parameter names. For example
 * `extractFunctionArgumentNames(function(a,b){}) == ['a','b']`
 *
 * @param  {Function} fn The function to reflect on
 * @return {Array}      Array of strings with the parameter names
 */
exports.extractFunctionArgumentNames = function(fn) {
	//http://stackoverflow.com/a/14660057
	return fn.toString()
		.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
		.match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
		.split(/,/);
};

exports.isFunction = function(fn) {
	return typeof fn === "function";
};

exports.flatten = function(ar) {
	function flattenHelper(subset, resultset) {
		subset.forEach(function(item) {
			if (util.isArray(item))
				flattenHelper(item, resultset);
			else
				resultset.push(item);
		});
	}
	var res = [];
	flattenHelper(ar, res);
	return res;
};

exports.hyphenate = function(name) {
	return (name.length == 1 ? "-" : "--") + name.replace(/[^A-Za-z0-9]+/g, "-").replace(/([a-z])([A-Z])/g, function(_, l, r) {
		return l + "-" + r.toLowerCase();
	});
};

/**
 * changes ["abc', "-abc", "def"] to ["abc", "-a", "-b", "-c", "def"]
 * @param  {[type]} args [description]
 * @return {[type]}      [description]
 */
exports.normalizeCliFlags = function(args) {
	var res = [];
	args.forEach(function(arg) {
		var combinedFlags = arg.match(/^-(\w+)$/);
		if (combinedFlags)
			res = res.concat(combinedFlags[1].split('').map(function(x) { return "-" + x; }));
		else
			res.push(arg);
	});
	return res;
};

exports.tail = function(ar) {
	var res = [].concat(ar);
	res.shift();
	return res;
};

exports.buildError = function(name, message) {
	return exports.extend(new Error(message), { name: name});
};

/**
 * Check whether a given array of arguments contains enough arguments. 
 * If amount is positive, the amount of required arguments should be exact,
 * if it is negative, arguments is allowed to have superfluos arguments.
 * Throws 'InvalidAmountOfArgumentsError' if the condition isn't met. 
 * 
 * @param  {[array]} args   [description]
 * @param  {number} amount [description]
 */
exports.expectArgs = function(args, amount) {
	args = exports.toArray(args);
	if (amount >= 0 && args.length != amount)
		throw exports.buildError('InvalidAmountOfArgumentsError','Expected ' + amount + ' argument(s), found ' + args.length + ' argument(s)');
	if (amount < 0 && args.length < Math.abs(amount))
		throw exports.buildError('InvalidAmountOfArgumentsError','Expected at least ' + amount + ' argument(s), found ' + args.length + ' argument(s)');

};
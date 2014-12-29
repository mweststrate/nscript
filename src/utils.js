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
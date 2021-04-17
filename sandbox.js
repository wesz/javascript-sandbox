function Sandbox(code, api)
{
	var self = this;

	this.valid = true;
	this.code = code;
	this.is_function = false;
	this.params = { Object: true };
	this.natives = [ Object, Array, RegExp, String, Boolean, Date ];
	this.eval = eval;
	this.freeze = Object.prototype.freeze;
	this.seal = Object.prototype.seal;
	this.defineproperty = Object.prototype.defineProperty;
	this.defineproperties = Object.prototype.defineProperty;
	this.definesetter = Object.__proto__.__defineSetter__;
	this.definegetter = Object.__proto__.__defineGetter__;
	this.bind = Object.prototype.bind;
	this.map = Array.prototype.map;
	this.filter = Array.prototype.filter;

	('__defineGetter__,__defineSetter__,__proto__' + Object.getOwnPropertyNames(__proto__) + Object.getOwnPropertyNames(window)).split(',').sort().map( function(a)
	{
		this[a] = true;
	}, this.params);

	if (this.code.call)
	{
		this.is_function = true;
		this.code = String(this.code);

		delete this.params.Object;
	}

	this.object = Object.bind();

	Object.getOwnPropertyNames(Object).map( function(a)
	{
		if (Object[a] && Object[a].bind)
		{
			this[a] = Object[a].bind(Object);
		}

		return this;
	}, this.object)[0];

	delete this.params.eval;
	delete this.params.arguments;

	Object.keys(api || {}).map( function(a)
	{
		delete self.params[a];
	});

	// prevent usage of async keyword
	if (this.code.indexOf('async') != -1)
	{
		this.valid = false;

		throw 'async!';
	}

	if (this.code.indexOf('import') != -1)
	{
		this.valid = false;

		throw 'import!';
	}

	if (this.code.indexOf('class') != -1)
	{
		this.valid = false;

		throw 'class!';
	}

	// prevent GeneratorFunction syntax
	if (/(function)(\s*?\/|[^(]*?\*)(.*?)[(]/g.test(this.code))
	{
		this.valid = false;

		throw 'GeneratorFunction!';
	}

	this.sandbox = null;

	this.init();

	try
	{
		this.sandbox = Function(Object.keys(this.params).filter(/./.test, /^[\w\$]+$/), '\'use strict\';' + this.code);
	} catch(e)
	{
		throw e;
	}

	this.flush();
}

Sandbox.prototype.exec = function()
{
	if ( ! this.valid)
	{
		return;
	}

	this.init();

	try
	{
		this.sandbox.call(this.object);
	} catch(e)
	{
		throw e;
	}

	this.flush();
};

Sandbox.prototype.init = function()
{
	Function.prototype.constructor = null;

	eval = null;
	Object.prototype.freeze = null;
	({}).constructor.freeze = null;
	Object.prototype.seal = null;
	({}).constructor.seal = null;
	Object.prototype.defineProperty = null;
	({}).constructor.defineProperty = null;
	Object.prototype.defineProperties = null;
	({}).constructor.defineProperties = null;
	Object.__proto__.__defineSetter__ = null;
	({}).__proto__.__defineSetter__ = null;
	Object.__proto__.__defineGetter__ = null;
	({}).__proto__.__defineGetter__ = null;
};

Sandbox.prototype.flush = function()
{
	Function.prototype.constructor = Function;

	eval = this.eval;
	Object.prototype.freeze = this.freeze;
	({}).constructor.freeze = this.freeze;
	Object.prototype.seal = this.seal;
	({}).constructor.seal = this.seal;
	Object.prototype.defineProperty = this.defineproperty;
	({}).constructor.defineProperty = this.defineproperty;
	Object.prototype.defineProperties = this.defineproperties;
	({}).constructor.defineProperties = this.defineproperties;
	Object.__proto__.__defineSetter__ = this.definesetter;
	({}).__proto__.__defineSetter__ = this.definesetter;
	Object.__proto__.__defineGetter__ = this.definegetter;
	({}).__proto__.__defineGetter__ = this.definegetter;

	Object.prototype.bind = this.bind;
	Array.prototype.map = this.map;
	Array.prototype.filter = this.filter;
};

var $w = window;
var $d = document;
var $is = function(x, y) { return typeof x == y; };
var $undef = function(x) { return $is(x, 'undefined'); };
var $tag = function(x, cx) { return (cx || $d).getElementsByTagName(x); };
var $class = function(x, cx) { return (cx || $d).getElementsByClassName(x); };
var $id = function(x, cx) { return (cx || $d).getElementById(x); };
var $create = function(x, v) { var e = $d.createElement(/^\s*<t(h|r|d)/.test(x) ? 'table' : 'div'); e.innerHTML = x; e = e.children.length == 1 ? e.children[0] : e.children; if ( ! $undef(v)) $attr(e, v); return e; };
var $remove = function(x) { x.parentNode.removeChild(x); };
var $html = $tag('html')[0];
var $head = $tag('head')[0];
var $body = $tag('body')[0];
var _$ = {}; _$[/^\s*</] = $create; _$[/^\.[\w\-]+$/] = $class; _$[/^\w+$/] = $tag; _$[/^\#[\w\-]+$/] = $id;
var $ = function(x, cx) { if (x == $d) return [ $d ]; else if (x == $w) return [ $w ]; else if (x == 'body') return [ $d.body || $d.body.parentNode || $d.getElementsByTagName('body')[0] ]; if (x instanceof Array) return x; else if (x.nodeType && x.nodeType == 1) return [ x ]; x = x.replace(/\s*$/, '').replace(/^\s*/, ''); for (var k in _$) { var p = k.split('/'); if ((new RegExp(p[1], p[2])).test(x)) return Array.prototype.slice.call(_$[k](x.replace(/^(\.|\#)/, ''), cx)); } return Array.prototype.slice.call((cx || $d).querySelectorAll(x)); };
var $clone = function(x) { return x.cloneNode(true); };
var $css = function(x, k) { if ( ! $undef(k) && ! $is(k, 'string')) { for (var p in k) x.style[p] = k[p]; return; } var computed = (($w.getComputedStyle && $w.getComputedStyle(x, null)) || ($d.defaultView && $d.defaultView.getComputedStyle(x, '')) || x.currentStyle || x.style); if ($undef(k)) return computed; else if ($is(k, 'string')) return computed[k]; };
var $cssi = function(x) { var s = $d.createElement('style'); s.appendChild($d.createTextNode(x)); $head.appendChild(s); };
var $attr = function(x, k) { if ($is(k, 'string')) return x.getAttribute(k); else for (var p in k) x.setAttribute(p, k[p]); };
var $value = function(x) { if (x.tagName.toLowerCase() == 'select') return x.options[x.selectedIndex].hasAttribute('value') ? x.options[x.selectedIndex].value : x.options[x.selectedIndex].innerText; else return x.value; };
var $on = function(x, e, c, cx) { var lv = arguments.length == 4; var ev = e; var ex = x; var ec = c; if (lv) { ev = c; ex = e || x || $d; ec = function(ee) { var found, el = ee.target || ee.srcElement; while (el && el !== x) { var nodes = $(ex, el.parentNode || $d); var i = -1; while (nodes[++i] && nodes[i] != el); found = !! nodes[i]; if (found) break; el = el.parentElement; } if (found) { if (cx.call(el, ee) === false) ee.preventDefault(); ee.stopPropagation(); } }; } if (x.attachEvent) x.attachEvent('on' + ev, ec); else x.addEventListener(ev, ec); };
var $off = function(x, e, c) { if (x.detachEvent) x.detachEvent('on' + e, c); else x.removeEventListener(e, c); };
var $trigger = function(e, cx) { var ev = $d.createEvent ? new Event(event) : $d.createEventObject(); if ($d.createEvent) cx.dispatchEvent(ev); else cx.fireEvent('on' + e, ev); };
var $bind = function(context, func) { return function() { return func.apply(context, arguments); }; }
var $ready = function(c) { if ($d.readyState != 'loading') c(); else if ($d.addEventListener) $d.addEventListener('DOMContentLoaded', c); else $d.attachEvent('onreadystatechange', function() { if ($d.readyState=='complete') c(); }); };

var Caret = function(textarea, context)
{
	if ( ! (this instanceof Caret))
	{
		return new Caret(textarea, context);
	}

	this._background = null;
	this._output = null;
	this._autoheight = true;
	this._tabsize = 4;
	this._showwhitespace = true;
	this._linenumbers = true;
	this._html_highlight = true;
	this._selection_start = null;
	this._selection_end = null;
	this._textarea = textarea;
	this._errors = {};
	this._timeout = null;
	this._value = '';
	this._strip_html_div = null;

	return this;
};

Caret._global = {};

Caret.prototype.init = function()
{
	var self = this;

	var stylesheet =
	[
		'.caret-wrapper { display: block; position: relative; }',
		'.caret { display: block; min-height: 0 !important; resize: none; width: 98%; }',
		'.caret, .caret-output, .caret-background { border: none !important; outline: none !important; resize: none !important; border: none !important; margin: 0; padding: 0; text-indent: 0; font-family: monospace, monospace; line-height: 1.4 !important; letter-spacing: 0 !important; }',
		'.caret.caret-line-numbers + .caret-output > span, .caret.caret-line-numbers + .caret-output + .caret-background { margin-left: 32px; }',
		'.caret.caret-line-numbers, .caret.caret-line-numbers + .caret-background, .caret.caret-line-numbers + .caret-output + .caret-background { padding-left: 32px; margin-left: 0; }',
		'.caret-output { counter-reset: caret-line-count; opacity: 1; }',
		'.caret-output > span { padding: 0; line-height: 1; letter-spacing: 0 !important; font-size: inherit; font-family: inherit; color: transparent; }',
		'.caret-output > span > .caret-keyword { color: transparent; background: #999; }',
		'.caret-output > span > .caret-error { margin-left: 4px; background: #fdf2f5; color: #af1e2b; border: 1px solid #f8d5db; padding: 2px; }',
		'.caret-output > span:before { content: counter(caret-line-count); counter-increment: caret-line-count; display: block; font-weight: bold; position: absolute; display: none; width: 28px; left: 0px; text-align: right; line-height: 1.4; font-size: inherit; font-family: monospace, monospace; color: #000; opacity: 0.3; }',
		'.caret.caret-line-numbers + .caret-output > span:before { display: inline; }',
		'.caret, .caret-output { outline: none; white-space: pre !important; tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4; -webkit-tab-size: 4; background-color: transparent; z-index: 0;}',
		'.caret-output { overflow: hidden; }',
		'.caret-output > span { line-height: 1.4; }',
		'.caret:focus, .caret-background:focus { outline: none; }',
		'.caret-background { outline: none; display: block; position: absolute; top: 0; left: 0; z-index: -1; opacity: 0.3; }',
		'.caret-output { display: block; z-index: -2; position: absolute; top: 0; left: 0; }'
	];

	$cssi(stylesheet.join("\n"));

	if (this._linenumbers)
	{
		this._textarea.className += ' caret-line-numbers';
	}

	$attr(this._textarea, { spellcheck: false });
	$css(this._textarea, { 'tab-size': this._tabsize });

	this._textarea.insertAdjacentHTML('afterEnd', '<textarea class="caret caret-background" cols="80" rows="12"></textarea>');

	if (this._linenumbers || this._html_highlight)
	{
		this._textarea.insertAdjacentHTML('afterEnd', '<div class="caret-output"></div>');
	}

	this._background = $class('caret-background')[0];
	this._output = $class('caret-output')[0];

	if (this._background != null)
	{
		$css(this._background, { 'tab-size': this._tabsize });
	}

	if (this._autoheight)
	{
		$css(this._textarea, { 'overflow-y': 'hidden' });

		if (this._background != null)
		{
			$css(this._background, { 'overflow-y': 'hidden' });
		}

		if (this._output != null)
		{
			$css(this._output, { 'overflow-y': 'hidden' });
		}
	}

	this._strip_html_div = document.createElement('div');

	this._listen();
	this._update();
};

Caret.prototype._process_background = function()
{
	var content = this._textarea.value;

	if (this._showwhitespace)
	{
		content = content
			.replace(/ /g, "_")
			//.replace(/\t/g, "→".repeat(this._tabsize))
			.replace(/\n/g, "↵\n")
			.replace(/█\n/g, "█")
			.replace(/█↵\n/g, "█\n")
		.replace(/[a-zA-Z]/g, " ");
	}

	if (this._background != null)
	{
		this._background.value = content;

		this._background.scrollTop = this._textarea.scrollTop - 0.00001;
		this._background.scrollLeft = this._textarea.scrollLeft - 0.00001;
	}

	if (this._linenumbers || this._html_highlight)
	{
		$css(this._output,
		{
			'width': $css(this._textarea, 'width'),
			'height': $css(this._textarea, 'height'),
			'font-size': $css(this._textarea, 'font-size'),
			'font-family': $css(this._textarea, 'font-family')
		})

		content = this._textarea.value;

		if (this._html_highlight)
		{
			content = content.replace(/<((?=!\-\-)!\-\-[\s\S]*\-\-|((?=\?)\?[\s\S]*\?|((?=\/)\/[^.\-\d][^\/\]'"[!#$%&()*+,;<=>?@^`{|}~ ]*|[^.\-\d][^\/\]'"[!#$%&()*+,;<=>?@^`{|}~ ]*(?:\s[^.\-\d][^\/\]'"[!#$%&()*+,;<=>?@^`{|}~ ]*(?:=(?:"[^"]*"|'[^']*'|[^'"<\s]*))?)*)\s?\/?))>/gi,
				function(match)
				{
					return '<span class="caret-keyword">' + match.replace(/./gm, function(s)
					{
						return '&#' + s.charCodeAt(0) + ';';
					}) + '</span>';
				}
			);
		} else
		{
			content = content.replace(/./gm, function(s)
			{
				return '&#' + s.charCodeAt(0) + ';';
			});
		}

		this._output.innerHTML = (this._linenumbers ? '<span class="caret-line">' : '') + content.split("\n").join((this._linenumbers ? '&nbsp;</span><br /><span class="caret-line">' : '<br />')) + (this._linenumbers ? '&nbsp;</span>' : '');

		var lines = this._output.getElementsByClassName('caret-line');
		var line = '';

		for (var k in this._errors)
		{
			if (k <= lines.length)
			{
				line = this._errors[k].replace(/./gm, function(s)
				{
					return '&#' + s.charCodeAt(0) + ';';
				}).trim();

				if (line.length > 0)
				{
					lines[k - 1].innerHTML += '<span class="caret-error">' + line + '</span>';
				}
			}
		}

		this._output.scrollTop = this._textarea.scrollTop - 0.00001;
		this._output.scrollLeft = this._textarea.scrollLeft - 0.00001;
	}
};

Caret.prototype._process_content = function()
{
	var self = this;

	this.save_selection();

	this._textarea.innerHTML = this._textarea.value;

	this.restore_selection();
};

Caret.prototype._update = function()
{
	var self = this;

	this._process_content();

	if (this._autoheight)
	{
		var offset = this._textarea.offsetHeight - this._textarea.clientHeight;

		this._textarea.style.height = 'auto';
		this._textarea.style.height = this._textarea.scrollHeight + offset + 'px';

		$class('caret-wrapper')[0].style.height = this._textarea.height;

		if (this._background != null)
		{
			this._background.style.height = this._textarea.style.height;
		}

		if (this._output != null)
		{
			this._output.style.height = this._textarea.style.height;
		}
	}

	this._process_background();

	clearTimeout(this._timeout);

	this._timeout = setTimeout( function()
	{
		if (self._value != self._textarea.value)
		{
			self.onupdate();
			self._update();
			self._value = self._textarea.value;
		}
	}, 500);
};

Caret.prototype._listen = function()
{
	var self = this;

	$on(this._textarea, 'scroll', function()
	{
		self._process_background()
	});

	$on(this._textarea, 'select', function()
	{

	});

	$on(this._textarea, 'change', function()
	{
		self._update();
	});

	$on(this._textarea, 'mouseup', function()
	{
		self._update();
	});

	$on(this._textarea, 'mousedown', function()
	{

	});

	$on(this._textarea, 'keyup', function(e)
	{
		self._update();
	});

	$on(this._textarea, 'keydown', function(e)
	{
		var key = e.keyCode || e.which;

		if (key == 9)
		{
			e.preventDefault();

			var s = this.selectionStart;

			this.value = this.value.substring(0, this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
			this.selectionEnd = s + 1;
		}

		self._update();
	});
};

Caret.prototype.get_position = function()
{
	return this._textarea.selectionStart;
};

Caret.prototype.set_position = function(position)
{
	this._textarea.selectionStart	= position;
	this._textarea.selectionEnd = position;
	this._textarea.focus();
};

Caret.prototype.has_selection = function()
{
	if (this._textarea.selectionStart == this._textarea.selectionEnd)
	{
		return false;
	}

	return true;
};

Caret.prototype.save_selection = function()
{
	this._selection_start = this._textarea.selectionStart;
	this._selection_end = this._textarea.selectionEnd;
};

Caret.prototype.restore_selection = function()
{
	if (this._selection_start != this._selection_end)
	{
		this.select(this._selection_start, this._selection_end);
	}
};

Caret.prototype.clear_selection = function()
{
	if (this._selection_start != this._selection_end)
	{
		this._textarea.value = this._textarea.value.slice(0, this._selection_start) + this._textarea.value.slice(this._selection_end);
	}
};

Caret.prototype.get_selection = function()
{
	return this._textarea.value.substring(this._textarea.selectionStart, this._textarea.selectionEnd);
};

Caret.prototype.select = function(start, end)
{
	this._textarea.selectionStart = start;
	this._textarea.selectionEnd = end;
	this._textarea.focus();
};

Caret.prototype.insert = function(text, offset_selection)
{
	var pos = this.get_position();

	this.save_selection();
	this._textarea.value = [ this.slice(0, pos), text, this._textarea.value.slice(pos) ].join('');
	this.set_position(pos + (offset_selection ? offset_selection : 0));
};

Caret.prototype.error = function(line, message)
{
	if (line < 1)
	{
		line = 1;
	}

	this._errors[line] = message;
	this._process_background();
};

Caret.prototype.clear_errors = function()
{
	this._errors = {};
	this._process_background();
};

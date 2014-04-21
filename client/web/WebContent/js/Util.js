define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {
	
	Util = {
			
		cloneViaJSON: function (json)
		{
			return JSON.parse(JSON.stringify(json));
		},
			
		eightCharsFromKeyId: function(s)
		{
			if (s.length == 16)
				return s.substr(8);
			
			return s.toLowerCase();
		},
		
		guid : function () {
			function s4() {
				  return Math.floor((1 + Math.random()) * 0x10000)
				             .toString(16)
				             .substring(1);
				};

		  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		         s4() + '-' + s4() + s4() + s4();
		},
		
		trim: function(str)
		{
			return str.trim();
		},
		
		trimChars: function(str, chars)
		{
			var b = 0;
			while (b < str.length && chars.indexOf(str[b])!=-1)
				++b;
			
			var e = str.length -1;
			while (e >= b && chars.indexOf(str[e])!=-1)
				--e;
			
			return str.substr(b, e-b+1);
		},
		
		trimQuotes: function(str)
		{
			return this.trimChars(str, "'\"");
		},
		
		trimOneNewLine: function(str)
		{
			if (str.startsWith('\r\n'))
				str = str.substr(2);
			else
			if (str.startsWith('\n'))
				str = str.substr(1);
			
			if (str.endsWith('\r\n'))
				str = str.substr(0, str.length-2);
			else
			if (str.endsWith('\n'))
				str = str.substr(0, str.length-1);
			
			return str;
		},
		
		getNameFromEmail: function(email)
		{
			email = email || "";
			var name = email.substr(0, email.indexOf('<')).trim();
			if (name != '')
				return Util.trimQuotes(name);
			
			var name = email.substr(0, email.indexOf('@')).trim();
			if (name != '')
				return name;

			return email;
		},
		
		getAddressFromEmail: function(email)
		{
			email = email || "";
			email = email.trim();

			{
				var re = /.*\<(.*?)\>/;
				var r = re.exec(email);
				if (r != null && r.length ==2)
					return r[1];
			}
			
			{
				if (email.contains("<") && !email.contains(">"))
					return null;
				
				if (email.contains(">") && !email.contains("<"))
					return null;
				
				if (email.contains(" "))
					return null;
			}

			return email;
		},
		
		getSignatureHashTypeFromSignedContent: function(content_)
		{
			var content = content_.replace(/\r/gm, "");
			var re = /-+BEGIN PGP SIGNED MESSAGE-+\nHash:\s*(\S+)\n[\s\S]*?/gm;
			var matches = re.exec(content);
		
			if (matches)
				return matches[1];
			
			return null;
		},
		
		getSignatureFromSignedContent: function(content)
		{
			var re = /(-+BEGIN PGP SIGNATURE-+([\s\S]*?)-+END PGP SIGNATURE-+)/gm;
			var matches = re.exec(content);
		
			if (matches)
				return matches[1];
			
			return null;
		},

		getUserFriendlyDate : function(dateString)
		{
			var now = new Date();
			var nowT = now.getTime();
			
			var date = Util.fromDateSerializable(dateString);
			var dateT = date.getTime();
			
			var dt = (nowT - dateT)/1000;
			if (dt < 60)
				return "Just now";
			if (dt < 60 * 60)
				return Math.round(dt / 60) + " min. ago";
			if (dt < 3600 * 12)
				return Math.round(dt / 3600) + " hours ago";
			
			var full = (date.getMonth()+1) + "/" + date.getDate() + "/" + (date.getYear()+1900);
			return full;
		},
		
		toDateSerializable: function(date)
		{
			var d = date || new Date();
			return d.getTime();
		},
		
		fromDateSerializable: function(str)
		{
			return new Date(parseInt(str));
		},
		
		timeouts: {},
		keyTimeout: function (key, duration, fn)
		{
			var that = this;
			if (_.has(this.timeouts, key))
				clearTimeout(this.timeouts[key]);
			this.timeouts[key] = setTimeout( function() { 
					delete that.timeouts[key]; 
					fn();
				}, 
				duration
			);
		},
		
		onNextTick: function(fn)
		{
			return setTimeout(fn, 1);
		},
		
		toHtml: function(text)
		{
			var d = $('<div/>');
			d.text(text);
			return d.html();
		},
		
		toText: function(html_)
		{
			if (html_ == null)
				return null;
			
			var d = $('<div/>');
			var html = html_;
			html = html.replace(/\r/gm, '');
			html = html.replace(/\n/gm, '');
			html = html.replace(/\<[\s]*br/gmi,'\n<br');
			html = html.replace(/\<[\s]*p/gmi,'\n\n<p');
			d.html(html);
			var value = d.text();
			
			// left over from mailiverse, not sure if we need this
			value = value.replace(/\u00A0/g,""); // somehow weird A0 control characters are showing up
			var lines = value.split(/\r\n|\r|\n/);	
			return lines.join("\r\n");
		},
		
		toInputValText: function(text)
		{
			return $('<div/>').text(text).text();
		},
		
		fixTypeAheadToWorkWithCommas: function (input) {
			var z = $.data(input, 'ttTypeahead');
			z.input.getInputValue = function() {
				var s = z.input.$input.val();
				var c = s.lastIndexOf(',');
				return s.substr(c+1);
			};
			z.input.setInputValue = function(value_, silent) {
				var value = value_.trim();
				var s = z.input.$input.val();
				var c = s.lastIndexOf(',');
				var f = (c >= 0) ? (s.substr(0, c+1) + " " + value) : value;
				z.input.$input.val(f);
				z.input.$input.trigger('input');
			};
	
			z.input.setHintValue = function(value_) {
				var value = value_.trim();
				var s = z.input.$input.val();
				var c = s.lastIndexOf(',');
				var f = (c >= 0) ? (s.substr(0, c+1) + " " + value) : value;
				z.input.$hint.val(f);
			};
			
			z.input.clearHint = function() {
				z.input.setHintValue("");
			};
			
			z.input.resetInputValue = function () {
				z.input.trigger('input');
//				z.input.setInputValue(z.input.query);
			}
		},
		
		splitAndTrim: function (s, d)
		{
			if (!s)
				return [];
			return _.without(_.map(s.split(d), function(w) { return w.trim(); }), '');
		},
		
		addOrRemoveClass: function( div, clazz, toggle)
		{
			if (toggle != div.hasClass(clazz))
				div.toggleClass(clazz);
		}
	} ;
});
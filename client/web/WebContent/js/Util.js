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
		
		getNameFromEmail: function(email)
		{
			email = email || "";
			var name = email.substr(0, email.indexOf('<')).trim();
			if (name != '')
				return name;
			
			var name = email.substr(0, email.indexOf('@')).trim();
			if (name != '')
				return name;

			return email;
		},
		
		getAddressFromEmail: function(email)
		{
			email = email || "";
			var re = /.*\<(.*?)\>/;
			var r = re.exec(email);
			if (r != null && r.length ==2)
				return r[1];
			
			return email;
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
		
		toText: function(html)
		{
			var d = $('<div/>');
			d.html(html);
			var value = d.text();
			
			value = value.replace(/\u00A0/g,""); // somehow weird A0 control characters are showing up
			var lines = value.split(/\r\n|\r|\n/);	
			return lines.join("\r\n");
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
//				z.input.setInputValue(z.input.query);
			}
		},
		
		splitAndTrim: function (s, d)
		{
			if (!s)
				return [];
			return _.without(_.each(s.split(d), function(w) { return w.trim(); }), '');
		},
		
		addOrRemoveClass: function( div, clazz, toggle)
		{
			if (toggle != div.hasClass(clazz))
				div.toggleClass(clazz);
		}
	} ;
});
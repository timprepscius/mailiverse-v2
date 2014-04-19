define([
	'jquery',
	'underscore',
	'backbone',
	
	'mime',
], function ($,_,Backbone, Mime) {
	
	OriginalIdExposedFields = [ 'syncId' ];

	OriginalId = Backbone.Model.extend({
    	exposedFields: OriginalIdExposedFields,
    	idAttribute: "syncId",
		
    	initialize: function(options)
    	{
    	}
	});

	OriginalExposedFields = [ 'syncId', 'syncOwner', 'syncVersion', 'sent', 'user' ];

	Original = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Original',
    	mails: null,
    	exposedFields: OriginalExposedFields,
    	
    	processed: null,
    	
    	initialize: function(options)
    	{
    	},
    	
    	parseMime: function(callbacks)
    	{
    		this.processDecryptEnvelope(callbacks);
    	},
    	
    	decryptWithoutProcessing: function(callbacks)
    	{
    		Crypto.decryptPGP ( 
    			this.get('data'),
    			callbacks
    		);
    	},
    	
    	processDecryptEnvelope: function (callbacks)
    	{
    		var that = this;
    		Crypto.decryptPGP ( 
    			this.get('data'),
				{
					success: function (decrypted) { 
						console.log(decrypted);
						that.processParseMime(decrypted, callbacks); 
					},
					failure: callbacks.failure
				}
    		);
    	},
    	
    	processParseMime: function (decrypted, callbacks)
    	{
    		var mime = new Mime();
    		this.processed = mime.processMessage(decrypted);
    		console.log(this.processed);
    		
    		callbacks.success(this);
    	},
    	
    	getHeaderValueInPart: function(part, key, defaultValue)
    	{
    		for (var i in part.headers)
			{
    			var kv = part.headers[i];
    			if (kv.key.toLowerCase() == key.toLowerCase())
    				return kv.value.replace('\r','');
			}
    		
    		return defaultValue;
    	},
    	
    	getHeaderSubValue: function(value, subKey)
    	{
    		var re = new RegExp(subKey + "=([\\S]*)", "gm");
    		var matches = re.exec(value);
    		if (matches)
    			return Util.trimChars(matches[1], '\'";');
    		
    		return null;
    	},
    	
    	getHeaderSubValueInPart: function(part, key, subKey)
    	{
    		for (var i in part.headers)
			{
    			var kv = part.headers[i];
    			if (kv.key.toLowerCase() == key.toLowerCase())
    				return this.getHeaderSubValue(kv.value, subKey);
			}
    		
    		return null;
    	},
    	
    	replaceHeaderValueInPart: function(part, key, value)
    	{
    		for (var i in part.headers)
			{
    			var kv = part.headers[i];
    			if (kv.key.toLowerCase() == key.toLowerCase())
    			{
    				kv.value = value;
    				return;
    			}
			}
    		
    		part.headers.push({ key: key, value: value});
    	},
    	
    	getHeaderValue: function(key, defaultValue)
    	{
    		var part = this.processed[0];
    		if (!part)
    			return defaultValue;
    		
    		return this.getHeaderValueInPart(part, key, defaultValue);
    	},
    	
    	getHeaderValueDecode: function(key, defaultValue)
    	{
    		var value = this.getHeaderValue(key, defaultValue);
    		
			if (EncodersInline.is(value))
				value = EncodersInline.decode(value);

			return value;
    	},

    	getHeaderValueInPartBeforeSemicolon: function (part, key, defaultValue)
    	{
    		var v = this.getHeaderValueInPart(part, key, defaultValue);
    		if (v)
    		{
    			return v.split(';')[0];
    		}
    		
    		return null;
    	},
    	
    	getDecodedPart: function(part)
    	{
    		var encoding = this.getHeaderValueInPartBeforeSemicolon(part, "Content-Transfer-Encoding");
			var charset = this.getHeaderSubValueInPart(part, "content-type", "charset");
    		if (encoding)
    		{
    			return Encoders.decode(part.data, encoding, charset);
    		}
    		
    		return part.data;
    	},
    	
    	convertToReadable: function(part, tags)
    	{
    		// with some e-mails, specifically e-mails from the postfix user list
    		// sometimes the contents don't have a content-type
    		// so we make the default type text/plain, hopefully this will not cause problems
			var contentType = this.getHeaderValueInPartBeforeSemicolon(part, 'Content-Type', 'text/plain');
			if (part.data)
			{
	    		if (contentType == 'text/plain')
	    		{
	    			var div = $("<div/>");
	    			var text = this.getDecodedPart(part);
	    			text = text.replace(/\r/gm, "");
	    			div.text(text);
	    			var result = "<pre>" + div.html() + "</pre>";
	    			
	    			return { type: 'text', content: result, tags:_.clone(tags) };
	    		}
	    		else
	    		if (contentType == 'text/html')
	    		{
	    			var result = Sandbox.strip(this.getDecodedPart(part));
	    			
	    			return { type: 'html', content: result, tags:_.clone(tags) };    			
	    		}
			}
    		
    		return null;
    	},
    	
    	collectUserReadableContents: function(parts, results, mode, tags)
    	{
    		mode = mode || "all";
    		var parentTags = tags || {};
    		
			results = results || [];
    		var alternativeBest = null;
    		var alternativeBestContentType = "0 none";
			
			_.each(parts, function (part) {
				// propagate the tags 
				var tags = _.clone(parentTags);
				var tagsToCheck = ['signatureVerified', 'decrypted', 'signatureFailed'];
				_.each(tagsToCheck, function(tag) {
					if (_.has(part, tag))
						if (part[tag])
							tags[tag] = part[tag];
				});

				var subresults = [];

				var contentType = this.getHeaderValueInPartBeforeSemicolon(part, 'Content-Type');
				
				if (contentType && contentType.startsWith('multipart/alternative'))
				{
					this.collectUserReadableContents(part.data, subresults, "alternative", tags);
				}
				else
				if (contentType && contentType.startsWith('multipart'))
				{
					this.collectUserReadableContents(part.data, subresults, "all", tags);
				}
				else
				{
					var readable = this.convertToReadable(part, tags);
					if (readable)
						subresults.push(readable);
				}
				
				if (mode == 'alternative')
				{
					var recursiveContentType = this.getHeaderValueInPartBeforeSemicolon(part, 'recursive-content-type');
					var alternativeContentType = recursiveContentType || contentType;

					var ratedContentType = "0 none";
					
					if (alternativeContentType == "text/plain")
						ratedContentType = "1 text/plain";
					if (alternativeContentType == "text/html")
						ratedContentType = "2 text/html";
						
					if (ratedContentType > alternativeBestContentType)
					{
						alternativeBestContentType = ratedContentType;
						alternativeBest = subresults;
					}
				}
				else
				{
					_.each(subresults, function(readable) {
						results.push(readable);
					});
				}
				
			}, this);
			
			if (mode == 'alternative')
			{
				if (alternativeBest)
				{
					_.each(alternativeBest, function(readable) {
						results.push(readable);
					});
				}
			}
			
			return results;
    	},
    	
    	collectPartsWithContentType: function(parts, contentType, partsWithContentType)
    	{
    		var that = this;
    		
    		partsWithContentType = partsWithContentType || [];
    		_.each(parts, function(part) {
    			
				var c = this.getHeaderValueInPartBeforeSemicolon(part, 'Content-Type');
				if (c)
				{
					if (c.startsWith(contentType))
					{
						partsWithContentType.push(part);
					}
					else
					if (c.startsWith("multipart"))
					{
						if (part.data)
							that.collectPartsWithContentType(part.data, contentType, partsWithContentType);
					}
				}
    		}, this);
    		
    		return partsWithContentType;
    	},    	
    });

    Originals = Backbone.Collection.extend({
    	url: function () { 
    		return Constants.REST + 'Originals?field=' +this.field + 
    			"&id="+ this.id + 
    			"&orderBy=syncVersion&orderDirection=1" +
    			"&onlyIds" +
    			(this.after?"&insertedAfter=" + this.after:""); 
    	},
        model: OriginalId,
    	exposedFields: OriginalExposedFields,

    	initialize: function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.after = options.after;
        },
    });
});


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
    				return kv.value;
			}
    		
    		return defaultValue;
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
    	
    	getHeaderValueQPDecode: function(key, defaultValue)
    	{
    		var value = this.getHeaderValue(key, defaultValue);
    		
			if (EncoderQpInline.is(value))
				value = EncoderQpInline.decode(value);

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
    	
    	convertToReadable: function(part, tags)
    	{
			var contentType = this.getHeaderValueInPartBeforeSemicolon(part, 'Content-Type');
			if (part.data)
			{
	    		if (contentType == 'text/plain')
	    		{
	    			var div = $("<div/>");
	    			var text = part.data;
	    			text = text.replace(/\r/gm, "");
	    			div.text(text);
	    			var result = "<pre>" + div.html() + "</pre>";
	    			
	    			return { type: 'text', content: result, hash: Crypto.simpleHash(part.data), tags:_.clone(tags) };
	    		}
	    		else
	    		if (contentType == 'text/html')
	    		{
	    			var result = Sandbox.strip(part.data);
	    			
	    			return { type: 'html', content: result, hash: Crypto.simpleHash(part), tags:_.clone(tags) };    			
	    		}
			}
    		
    		return null;
    	},
    	
    	collectUserReadableContents: function(parts, results, mode, tags)
    	{
    		mode = mode || "all";
    		var parentTags = tags || {};
    		
    		var alternativeBestPart = null;
    		var alternativeBestContentType = "0 none";
    		
			results = results || [];
			_.each(parts, function (part) {
				// propagate the tags 
				var tags = _.clone(parentTags);
				if (part.signatureVerified)
					tags.signatureVerified = true;
				if (part.decrypted)
					tags.decrypted = true;

				var contentType = this.getHeaderValueInPartBeforeSemicolon(part, 'Content-Type');
				

				var readable = this.convertToReadable(part, tags);
				if (readable)
				{
					var ratedContentType = "0 none";
					
					if (contentType == "text/plain")
						ratedContentType = "1 text/plain";
					if (contentType == "text/html")
						ratedContentType = "2 text/html";
						
					if (ratedContentType > alternativeBestContentType && mode == 'alternative')
					{
						alternativeBestContentType = ratedContentType;
						alternativeBestPart = readable;
					}
					else
					{
						results.push(readable);
					}
				}
				else
				{
					if (contentType && contentType.startsWith('multipart/alternative'))
					{
						this.collectUserReadableContents(part.data, results, "alternative", tags);
					}
					else
					if (contentType && contentType.startsWith('multipart'))
					{
						this.collectUserReadableContents(part.data, results, "all", tags);
					}
				}
			}, this);
			
			if (mode == 'alternative')
			{
				if (alternativeBestPart)
					results.push(alternativeBestPart);
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


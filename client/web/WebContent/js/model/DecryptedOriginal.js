define([
        'jquery',
        'underscore',
        'backbone',
        'mime',
        'js/model/Original',
        
], function ($,_,Backbone, Mime) {

	DecryptedOriginal = Original.extend({

		initialize: function(attributes, options) 
		{
			this.processed = Util.cloneViaJSON(options.original.processed);
			this.id = options.original.id;
			Original.prototype.initialize(arguments);
		},

    	assignParents: function(parts, parent)
    	{
			_.each(parts, function(part) {
				part.parent = parent;
				
				if (_.isArray(part.data))
					this.assignParents(part.data, part);
			}, this);
    	},
    	
    	removeParents: function(parts)
    	{
			_.each(parts, function(part) {
				delete part.parent;
				
				if (_.isArray(part.data))
					this.removeParents(part.data, part);
			}, this);
    	},
    	
    	removeOriginals: function(parts)
    	{
			_.each(parts, function(part) {
				delete part.original;
				
				if (_.isArray(part.data))
					this.removeOriginals(part.data, part);
			}, this);
    	},
    	
    	getPGPEncryptedBlockIfAny: function(text)
    	{
			var re = /(-+BEGIN PGP MESSAGE-+[\s\S]*?-+BEGIN PGP MESSAGE-+)/gm;
			var matches = re.exec(text);
		
			if (matches)
				return matches[1];
    		
    		return null;
    	},
    	
    	collectPartsToDecrypt: function(parts)
    	{
    		parts = parts || this.processed;
    		var that = this;
    		var partsToDecrypt = [];

    		var multipartEncrypteds = this.collectPartsWithContentType(parts, "multipart/encrypted");
    		_.each(multipartEncrypteds, function(multipart) {
    			if (multipart.data && multipart.data.length == 3 && multipart.data[2].data )
    				partsToDecrypt.push( { part: multipart, block: multipart.data[2].data } );
    		});
    		
    		var textParts = this.collectPartsWithContentType(parts, "text/plain");
    		_.each(textParts, function(textPart) {
    			var pgpBlock = that.getPGPEncryptedBlockIfAny(textPart.data);
    			if (pgpBlock)
    				partsToDecrypt.push({ part: textPart, block: pgpBlock });
    		});
	
			return partsToDecrypt;
    	},
    	
    	decryptParts: function(callbacks)
    	{
    		var partsToDecrypt = this.collectPartsToDecrypt();
    		
    		var onAllDecrypted = _.after(partsToDecrypt.length+1, function() {
    			
    			_.each (partsToDecrypt, function (partToDecrypt) {
    				var part = partToDecrypt.part;
    				if (part.decryptedBlock)
    				{
	    				var mime = new Mime();
						var decryptedParts = mime.processMessage(part.decryptedBlock);
						part.data = decryptedParts;
						part.decrypted = true;
    				}
    			});

    			callbacks.success();
    		});
    		
    		_.each(partsToDecrypt, function(partToDecrypt) {
    			Crypto.decryptPGP(partToDecrypt.block, {
    				success: function (decrypted) {
    					partToDecrypt.part.decryptedBlock = decrypted;
    					onAllDecrypted();
    				},
    				failure: onAllDecrypted
    			});
    		});
    		
    		// if there are no parts, still ping it
    		onAllDecrypted();
    	},
    	
    	getPGPSignedBlockIfAny: function(text)
    	{
			var re = /(-+BEGIN PGP SIGNED MESSAGE-+[\s\S]*?-+BEGIN PGP SIGNATURE-+([\s\S]*?)-+END PGP SIGNATURE-+)/gm;
			var matches = re.exec(text);
		
			if (matches)
				return matches[1];
    		
    		return null;
    	},
    	
    	getPGPSignedContent: function(text)
    	{
			var re = /([\s\S]*)^-+BEGIN PGP SIGNED MESSAGE-+([\s\S]*?)-+BEGIN PGP SIGNATURE-+[\s\S]*?-+END PGP SIGNATURE-+([\s\S]*)/gm;
			var matches = re.exec(text);
		
			if (matches)
			{
				var prefix = matches[1].trim();
				var signed = matches[2].trim();
				var postfix = matches[3].trim();
				
				if (signed.toLowerCase().startsWith('hash:'))
					signed = signed.substr(signed.indexOf("\n")).trim();
				
				return [prefix, signed, postfix];
			}
			
    		return null;
    	},
    	
    	collectPartsToCheckSignature: function()
    	{
    		var that = this;
    		var partsToCheck = [];
    		var parts = this.processed;
    		
    		var multipartEncrypteds = this.collectPartsWithContentType(parts, "multipart/signed");
    		_.each(multipartEncrypteds, function(multipart) {
    			if (multipart.data && multipart.data.length == 2 && multipart.data[0].original)
    			{
    				// @TODO this isn't right
    				var block = 
    					"-----BEGIN PGP SIGNED MESSAGE-----" + "\n" + 
						"Hash: pgp-sha1" + "\n" + 
						multipart.data[0].original + "\n" +
						multipart.data[1].data + "\n";
    				
    				partsToCheck.push({ part: multipart, block: block, shouldReplace: false });
    			}
    		});
    		
    		var textParts = this.collectPartsWithContentType(parts, "text/plain");
    		_.each(textParts, function(textPart) {
    			var pgpBlock = that.getPGPSignedBlockIfAny(textPart.data);
    			if (pgpBlock)
    				partsToCheck.push({ part: textPart, block: pgpBlock, shouldReplace: true });
    		});
	
			return partsToCheck;
    	},

    	processSignatures: function(callbacks)
    	{
    		var that = this;
    		
    		var author = this.getHeaderValueQPDecode('from');
    		
    		if (!author)
    		{
    			callbacks.failure();
    			return;
    		}
    		
    		var partsToCheck = this.collectPartsToCheckSignature();
    		
    		var onAllChecked = _.after(partsToCheck.length+1, function() {
    			
    			_.each (partsToCheck, function (partToCheck) {
    				var part = partToCheck.part;
    				if (part.signatureVerified)
    				{
    					// take out the part which we should read
    					// the signatureVerified icon will appear
    					if (partToCheck.shouldReplace)
    					{
    						var content = that.getPGPSignedContent(part.data);
							var prefix = content[0];
							var signed = content[1];
							var postfix = content[2];

							var contentType = that.getHeaderValueInPart(part, 'content-type');
							that.replaceHeaderValueInPart(part, 'content-type', 'multipart/mixed');
    						part.data = [];

    						if (prefix)
								part.data.push({ 
									headers: [{ key: 'content-type', value: contentType }], 
									data: prefix 
								});

    						part.data.push({ 
    							headers: [{ key: 'content-type', value: contentType }], 
    							data: signed,
    							signatureVerified:true
    						});
    						
    						if (postfix)
								part.data.push({ 
									headers: [{ key: 'content-type', value: contentType }], 
									data: postfix 
								});
    						
    						delete part.signatureVerified;
    					}
    				}
    			});

    			callbacks.success();
    		});
    		
    		_.each(partsToCheck, function(partToCheck) {
    			SignatureProcessor.checkSignature(this.id, author, partToCheck.block, {
    				success: function () {
    					partToCheck.part.signatureVerified = true;
    					onAllChecked();
    				},
    				failure: onAllChecked
    			});
    		}, this);
    		
    		// if there are no parts, still ping it
    		onAllChecked();
    	},
    	
    	process: function(callbacks)
    	{
    		var that = this;
    		this.assignParents(this.processed);
    		
    		that.decryptParts({
    			success: function () {
    				that.processSignatures({
    					success: function () {
    						that.removeOriginals(that.processed);
    						that.removeParents(that.processed);
    						callbacks.success();
    					},
    					failure: callbacks.failure
    				});
    			},
    			failure: callbacks.failure
    		});
    	},
    	
    	toMail: function(callbacks)
    	{
			var that = this;
			
			// construct the mail
    		var mail = new Mail({ syncId: Util.guid(), originalId: this.id });
    		
    		// put in the standard mail properties
    		var keys = ['subject', 'from', 'to', 'cc', 'bcc', 'date', 'reply-to'];
    		_.each(keys, function(key) { 
    			var value = this.getHeaderValueQPDecode(key);
    			mail.set(key, value);
    		}, this);
    		
    		this.process({
    			success: function()
    			{
    				mail.set('content', that.collectUserReadableContents(that.processed));
    				callbacks.success(mail);
    			},
    			failure: callbacks.failure
    		});
    	},
    	
	});
	
});
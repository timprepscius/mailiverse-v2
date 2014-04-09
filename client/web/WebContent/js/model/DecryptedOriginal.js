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

    	replacePartDataWithContentTriple: function(part, content, tags)
    	{
    		var prefix = content[0];
    		var body = content[1];
    		var postfix = content[2];
    		
			var contentType = this.getHeaderValueInPart(part, 'content-type');
			var contentEncoding = this.getHeaderValueInPart(part, 'Content-Transfer-Encoding');
			
			this.replaceHeaderValueInPart(part, 'content-type', 'multipart/mixed');
			this.replaceHeaderValueInPart(part, 'recursive-content-type', contentType);
			
			part.data = [];

			if (prefix)
				part.data.push({ 
					headers: [
					    { key: 'Content-Type', value: contentType },
					    { key: 'Content-Transfer-Encoding', value: contentEncoding }
					], 
					data: prefix 
				});

			part.data.push($.extend({ 
				headers: [
				    { key: 'Content-Type', value: contentType },
				    { key: 'Content-Transfer-Encoding', value: contentEncoding }
				], 
				data: body
			}, tags));
			
			if (postfix)
				part.data.push({ 
					headers: [
					    { key: 'Content-Type', value: contentType },
					    { key: 'Content-Transfer-Encoding', value: contentEncoding }
					], 
					data: postfix 
				});
    	},

    	
    	getPGPEncryptedContent: function(text)
    	{
			var re = /([\s\S]*?)(-+BEGIN PGP MESSAGE-+[\s\S]*?-+END PGP MESSAGE-+)([\s\S]*)/gm;
			var matches = re.exec(text);
		
			if (matches)
			{
				var prefix = matches[1].trim();
				var encrypted = matches[2].trim();
				var postfix = matches[3].trim();
								
				return [prefix, encrypted, postfix];
			}
			
    		return null;
    	},
    	
    	collectPartsToDecrypt: function(parts)
    	{
    		parts = parts || this.processed;
    		var that = this;
    		var partsToDecrypt = [];

    		var multipartEncrypteds = this.collectPartsWithContentType(parts, "multipart/encrypted");
    		_.each(multipartEncrypteds, function(multipart) {
    			if (multipart.data && multipart.data.length >= 2 && multipart.data[multipart.data.length-1].data )
    			{
        			var encrypted = multipart.data[multipart.data.length-1];
    				partsToDecrypt.push( { part: multipart, block:this.getDecodedPart(encrypted) } );
    			}
    		}, this);
    		
    		var textParts = this.collectPartsWithContentType(parts, "text/plain");
    		_.each(textParts, function(textPart) {
    			var pgpBlock = this.getPGPEncryptedContent(this.getDecodedPart(textPart));
    			if (pgpBlock)
    				partsToDecrypt.push({ part: textPart, block: pgpBlock[1], isInline:true });
    		}, this);
	
    		var htmlParts = this.collectPartsWithContentType(parts, "text/html");
    		_.each(htmlParts, function(htmlPart) {
    			var pgpBlock = this.getPGPEncryptedContent(Util.toText(this.getDecodedPart(htmlPart)));
    			if (pgpBlock)
    				partsToDecrypt.push({ part: htmlPart, block: pgpBlock[1], isInline:true });
    		}, this);
			return partsToDecrypt;
    	},
    	
    	decryptParts: function(callbacks)
    	{
    		var that = this;
    		var partsToDecrypt = this.collectPartsToDecrypt();
    		
    		var onAllDecrypted = _.after(partsToDecrypt.length+1, function() {
    			
    			_.each (partsToDecrypt, function (partToDecrypt) {
    				
    				var part = partToDecrypt.part;
    				if (part.decryptedBlock)
    				{
    					if (partToDecrypt.isInline)
    					{
    						// do *not* do the content decoding, because each part should do its own
    						// (i think)
    						var contentTriple = this.getPGPEncryptedContent(part.data);
    						contentTriple[1] = part.decryptedBlock;

    						this.replacePartDataWithContentTriple(
    							part, 
    							contentTriple, 
    							{ decrypted:true }
    						);

    						delete part.decrypted;
    					}
    					else
    					{
							this.replaceHeaderValueInPart(part, 'content-type', 'multipart/mixed');

							var mime = new Mime();
							var decryptedParts = mime.processMessage(part.decryptedBlock);
							part.data = decryptedParts;
							part.decrypted = true;
    					}
    				}
    			}, that);

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
			var re = /(-+BEGIN PGP SIGNED MESSAGE-+[\s\S]*?(-+BEGIN PGP SIGNATURE-+[\s\S]*?-+END PGP SIGNATURE-+))/gm;
			var matches = re.exec(text);
		
			if (matches)
				return [ matches[1], matches[2] ];
    		
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
    	
    	getSignatureHashType: function(multipart)
    	{
    		var header = this.getHeaderValueInPart(multipart, 'content-type');
    		var re = /micalg=(\S+)/gm;
    		var matches = re.exec(header);
    		
    		if (matches)
    			match = Util.trimChars(matches[1], '\'";').toUpperCase();
    		else
    			match = "error";
    		
    		if (match.startsWith("PGP-"))
    			match = match.substr(4);
    		
    		return match;
    	},
    	
    	collectPartsToCheckSignature: function()
    	{
    		var that = this;
    		var partsToCheck = [];
    		var parts = this.processed;
    		
    		var multipartEncrypteds = this.collectPartsWithContentType(parts, "multipart/signed");
    		_.each(multipartEncrypteds, function(multipart) {
    			if (multipart.data && multipart.data.length >= 2)
    			{
    				var signed =  multipart.data[multipart.data.length-2].original || "ERROR";
    				var signature = multipart.data[multipart.data.length-1].data || "ERROR";
    				// @TODO this probably isn't right, but seems to be working
    				var block = { clearText: Util.trimOneNewLine(signed), signature: signature };
/*
     					"-----BEGIN PGP SIGNED MESSAGE-----" + "\n" + 
						"Hash: " + this.getSignatureHashType(multipart) + "\n" + 
						signed +
						$.trim(signature) + "\n";
*/    				
    				partsToCheck.push({ part: multipart, block: block, shouldReplace: false });
    			}
    		}, this);
    		
    		var textParts = this.collectPartsWithContentType(parts, "text/plain");
    		_.each(textParts, function(textPart) {
    			var pgpBlock = that.getPGPSignedBlockIfAny(this.getDecodedPart(textPart));
    			if (pgpBlock)
    				partsToCheck.push({ 
    					part: textPart, 
    					block: { armoredText: pgpBlock[0], signature: pgpBlock[1] }, 
    					isInline: true 
    				});
    		}, this);
	
    		var htmlParts = this.collectPartsWithContentType(parts, "text/html");
    		_.each(htmlParts, function(htmlPart) {
    			var pgpBlock = this.getPGPSignedBlockIfAny(Util.toText(this.getDecodedPart(htmlPart)));
    			if (pgpBlock)
    				partsToDecrypt.push({ 
    					part: textPart, 
    					block: { armoredText: pgpBlock[0], signature: pgpBlock[1] }, 
    					isInline: true 
					});
    		}, this);
    		
			return partsToCheck;
    	},
    	
    	processSignatures: function(callbacks)
    	{
    		var that = this;
    		
    		var author = this.getHeaderValueDecode('from');
    		
    		if (!author)
    		{
    			callbacks.failure();
    			return;
    		}
    		
    		var partsToCheck = this.collectPartsToCheckSignature();
    		
    		var onAllChecked = _.after(partsToCheck.length+1, function() {
    			
    			_.each (partsToCheck, function (partToCheck) {
    				var part = partToCheck.part;
    				{
    					// take out the part which we should read
    					// the signatureVerified icon will appear
    					if (partToCheck.isInline)
    					{
    						this.replacePartDataWithContentTriple(
    							part, 
    							this.getPGPSignedContent(part.data), 
    							{ signatureVerified:part.signatureVerified, signatureFailed:part.signatureFailed }
    						);

    						delete part.signatureFailed;
    						delete part.signatureVerified;
    					}
    				}
    			}, that);

    			callbacks.success();
    		});
    		
    		_.each(partsToCheck, function(partToCheck) {
    			SignatureProcessor.checkSignature(this.id, author, partToCheck.block, {
    				success: function () {
    					partToCheck.part.signatureVerified = true;
    					onAllChecked();
    				},
    				failure: function() {
    					partToCheck.part.signatureFailed = true;
    					onAllChecked();
    				},
    			});
    		}, this);
    		
    		// if there are no parts, still ping it
    		onAllChecked();
    	},
    	
    	process: function(callbacks)
    	{
    		var that = this;
    		this.assignParents(this.processed);
    		
    		that.startDecryption(callbacks);
    	},
    	
    	startDecryption: function(callbacks)
    	{
    		var that = this;
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
    		var mail = new Mail({ originalId: this.id });
    		
    		// put in the standard mail properties
    		var keys = ['subject', 'from', 'to', 'cc', 'bcc', 'reply-to', 'message-id'];
    		_.each(keys, function(key) { 
    			var value = this.getHeaderValueDecode(key);
    			mail.set(key, value);
    		}, this);
    		
    		mail.computeIdFromMessageId();
    		
    		// special processing of the date string
    		var date = null;
    		try
    		{
    			date = new Date(this.getHeaderValueDecode("date"));
    		}
    		catch (exception)
    		{
    			date = new Date();
    		}
    		
    		mail.set('date', Util.toDateSerializable(date));
    		
    		// do final processing
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
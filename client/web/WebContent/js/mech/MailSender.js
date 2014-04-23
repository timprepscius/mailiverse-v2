define([
        'jquery',
        'underscore',
        'backbone',
        'text!templates/mailContentTemplate.mime',
        'text!templates/mailContentTextOnlyTemplate.mime',
        'text!templates/signedMailTemplate.mime',

        'modelBinder',
        ], function ($,_,Backbone,mailContentTemplate, mailContentTextOnlyTemplate, signedMailTemplate) {

	MailSender = Backbone.View.extend({

		initialize: function(options) 
		{
		},

		send: function(mail, callbacks_)
		{
			callbacks_ = callbacks_ || {};
			
			callbacks = { 
				success: function() {
					if (callbacks_.success)
						callbacks_.success(arguments);
				},
				
				failure: function() {
			    	mail.set('draft', true);
			    	mail.unset('sending');
			    	mail.recomputeParent();
			    	mail.save();
			    	
			    	if (callbacks_.failure)
			    		callacks_.failure();
				} 
			};
			
	    	mail.set('sending', true);
	    	mail.unset('draft');
	    	mail.recomputeParent();
			mail.save();
			
			if (mail.get('sendEncrypted') && mail.get('canSendEncrypted'))
			{
				var that = this;
				appSingleton.user.getKeyRing().getKeysForAddresses(
					mail.getRecipientEmailAddresses(), 
					{
						success: function (addressesToKeys)
						{
							that.sendEncrypted(addressesToKeys, mail, callbacks);
						},
						failure: callbacks.failure
					}
				);
			}
			else
			{
				return this.sendPlainText(mail, callbacks);
			}
		},
		
		createMailContent: function(mail)
		{
		    var html = mail.getHtml();
		    var text = mail.getOrSynthesizeText();
		    
		    var encodedHtml = Encoders.encode(html);
		    var encodedText = Encoders.encode(text);
		    
		    var mailContent = 
		    	mail.get('sendTextOnly') ?
			    	_.template(mailContentTextOnlyTemplate, { 
			    		contentBoundary: Util.guid(), 
			    		text: encodedText.block, 
			    		textEncoding: encodedText.encoding
			    	}) :
		    		_.template(mailContentTemplate, { 
		    			contentBoundary: Util.guid(), 
			    		text: encodedText.block, 
			    		textEncoding: encodedText.encoding,
		    			html: encodedHtml.block, 
		    			htmlEncoding: encodedHtml.encoding 
		    		});
			
			return mailContent;
		},
		
		sendPlainText: function(mail, callbacks)
		{
			var that = this;
			
			var mailContent = this.createMailContent(mail);
			
			if (mail.get('sendSigned'))
			{
			    Crypto.signPGP(mailContent, {
			    	success: function(signedContent) {
	
			    		var signature = Util.getSignatureFromSignedContent(signedContent);
			    		var signatureHashType = Util.getSignatureHashTypeFromSignedContent(signedContent);
			    		
					    var multiPart = 
					    	_.template(
					    		signedMailTemplate, 
					    		{ mailBoundary: Util.guid(), mailContent: mailContent, signature: signature, signatureHashType: signatureHashType }
					    	);
	
					    that.sendPlainTextDo (mail, multiPart, callbacks);
			    	},
			    	failure: callbacks.failure
			    });
			}
			else
			{
				this.sendPlainTextDo(mail, mailContent, callbacks);
			}
		},
		
		sendPlainTextDo: function(mail, mailContent, callbacks)
		{
		    var data = {
		    	to: Util.unkeyEmails(Util.splitAndTrim(mail.get('to'), ',')),
		    	cc: Util.unkeyEmails(Util.splitAndTrim(mail.get('cc'), ',')),
		    	bcc: Util.unkeyEmails(Util.splitAndTrim(mail.get('bcc'), ',')),
		    	subject: mail.get('subject'),
		    	content: mailContent,
		    	messageId: mail.get('message-id'),
		    	password: appSingleton.login.get('verification'),
		    	fromName: appSingleton.user.get('name'),
		    	version: Constants.VERSION,
		    };
		    
		    this.doSend(mail, data, callbacks);
		},
		
		sendEncrypted: function(addressesToPublicKeys, mail, callbacks)
		{
			var that = this;
			
		    // Get the public key so we can also read it in the sent box
		    var publicKey = appSingleton.login.get('publicKey');

		    // Encrypt message for all recipients in `addrPubKeys`
		    var pubKeys = _.map(_.values(addressesToPublicKeys), function(key) { return key.get('publicKey'); });
		    pubKeys.push(publicKey);
		    pubKeys = _.uniq(pubKeys);
		    
			var mailContent = this.createMailContent(mail);
		    
			Crypto.encryptPGP(pubKeys, mailContent, mail.get('sendSigned'), {
		    	
		    	success: function(encryptedMultiPart) {
				    var data = {
				    	to: Util.unkeyEmails(Util.splitAndTrim(mail.get('to'), ',')),
				    	cc: Util.unkeyEmails(Util.splitAndTrim(mail.get('cc'), ',')),
				    	bcc: Util.unkeyEmails(Util.splitAndTrim(mail.get('bcc'), ',')),
				    	subject: mail.get('subject'),
				    	encryptedContent: encryptedMultiPart,
				    	version: Constants.VERSION,
				    	messageId: mail.get('message-id'),
				    	password: appSingleton.login.get('verification'),
				    	fromName: appSingleton.user.get('name'),
				    	version: Constants.VERSION,
				    };
					    
				    that.doSend(mail, data, callbacks);
		    	},
		    	failure: callbacks.failure
		    });
		},
		
		doSend: function(mail, data, callbacks)
		{
			return false;
			
		    $.ajax({ 
		    	method: 'PUT',
		    	url: Constants.URL + 'util/Send', 
		    	data: JSON.stringify(data),
		    	headers: { 'X-Session' : appSingleton.login.get('session') }
		    }).success(function () {
		    	
		    	mail.set('sent', true);
		    	mail.unset('sending');
		    	mail.recomputeParent();
		    	mail.save();
		    	
		    	if (callbacks.success)
		    		callbacks.success();
		    	
		    }).fail(function () {
	    		callbacks.failure();
		    });
		},
		
	});
	
});
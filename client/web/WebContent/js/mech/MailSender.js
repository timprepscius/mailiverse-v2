define([
        'jquery',
        'underscore',
        'backbone',
        'text!templates/mailContentTemplate.mime',
        'text!templates/signedMailTemplate.mime',

        'modelBinder',
        ], function ($,_,Backbone,mailContentTemplate, signedMailTemplate) {

	MailSender = Backbone.View.extend({

		initialize: function(options) 
		{
		},

		send: function(mail, callbacks)
		{
			callbacks = callbacks || { success: function() {}, failure: function() {} };
			
	    	mail.set('sending', true);
	    	mail.unset('draft');
	    	mail.recomputeParent();
			mail.save();
			
			var that = this;
			appSingleton.user.getKeyRing().getKeysForAllAddresses(
				mail.getRecipientAddresses(), 
				{
					success: function (addressesToKeys)
					{
						that.sendEncrypted(addressesToKeys, mail, callbacks);
					},
					failure: function ()
					{
						that.sendPlainText(mail, callbacks);
					},
				}
			);
		},
		
		sendPlainText: function(mail, callbacks)
		{
			var that = this;
			
		    var html = mail.getHtml();
		    var text = mail.getOrSynthesizeText();

		    var mailContent = 
		    	_.template(mailContentTemplate, { contentBoundary: Util.guid(), text: text, html: html });

		    // Embed the subject into the body for verification
		    Crypto.signPGP(mailContent, {
		    	success: function(signedContent) {

		    		var signature = Util.getSignatureFromSignedContent(signedContent);
		    		
				    var multiPart = 
				    	_.template(
				    		signedMailTemplate, 
				    		{ mailBoundary: Util.guid(), mailContent: mailContent, signature: signature }
				    	);

				    var data = {
				    	to: Util.splitAndTrim(mail.get('to'), ','),
				    	cc: Util.splitAndTrim(mail.get('cc'), ','),
				    	bcc: Util.splitAndTrim(mail.get('bcc'), ','),
				    	subject: mail.get('subject'),
				    	content: multiPart,
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
		
		sendEncrypted: function(addressesToPublicKeys, mail, callbacks)
		{
			var that = this;
			
		    // Get the public key so we can also read it in the sent box
		    var publicKey = appSingleton.login.get('publicKey');

		    // Encrypt message for all recipients in `addrPubKeys`
		    var pubKeys = _.map(_.values(addressesToPublicKeys), function(key) { return key.get('publicKey'); });
		    pubKeys.push(publicKey);
		    pubKeys = _.uniq(pubKeys);
		    
		    var subject = mail.get('subject');
		    var html = mail.getHtml();
		    var text = mail.getOrSynthesizeText();
		    
		    var mailContent = 
		    	_.template(mailContentTemplate, { contentBoundary: Util.guid(), text: text, html: html });
		    
			Crypto.encryptPGP(pubKeys, mailContent, {
		    	
		    	success: function(encryptedMultiPart) {
				    var data = {
				    	to: Util.splitAndTrim(mail.get('to'), ','),
				    	cc: Util.splitAndTrim(mail.get('cc'), ','),
				    	bcc: Util.splitAndTrim(mail.get('bcc'), ','),
				    	subject: subject,
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
		    $.ajax({ 
		    	method: 'PUT',
		    	url: Constants.URL + 'util/Send', 
		    	data: JSON.stringify(data)
		    }).success(function () {
		    	
		    	mail.set('sent', true);
		    	mail.unset('sending');
		    	mail.recomputeParent();
		    	mail.save();
		    	
		    	if (callbacks.success)
		    		callbacks.success();
		    	
		    }).fail(function () {
		    	
		    	mail.set('draft', true);
		    	mail.unset('sending');
		    	mail.recomputeParent();
		    	mail.save();
		    	
		    	if (callbacks.failure)
		    		callbacks.failure();
		    });
		},
		
	});
	
});
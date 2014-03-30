define([
    'jquery',
    'underscore',
    ], function ($,_) {

	SignatureProcessor = {

		checkSignature: function(originalId, author, dataSigPair, callbacks)
		{
			var that = this;
			var address = Util.getAddressFromEmail(author);
			
			appSingleton.user.getKeyRing().getKeyCryptosForKeys([address], {
				success: function(addressesToKeys) {
					var key = addressesToKeys[address];
					
					var contact = appSingleton.user.getContacts().ensureContact(author);
					contact.syncedOnce(function () {
						that.check(originalId, dataSigPair, contact, key, callbacks);
					});
				},
				
				failure: callbacks.failure
			});
		},
				
		check: function (originalId, dataSigPair, contact, key, callbacks)
		{
			var that = this;
			Crypto.verifyPGP (key.get('publicKey'), dataSigPair, {
				success: function (result) {
					if (result)
					{
						that.onVerifySuccess(originalId, contact, key);
						callbacks.success();
					}
					else
					{
						that.onVerifyFailure(originalId, contact, key);
						callbacks.failure();
					}
				},
				failure: function () {
					that.onVerifyFailure(originalId, contact, key);
					callbacks.failure();
				},
			});
		},
		
		onVerifySuccess : function(originalId, key)
		{
			key.set('verified', 'success');
			key.set('lastVerificationDate', Util.toDateSerializable());
			key.set('lastVerifiedMail', originalId);
			
			key.save();
		},
		
		onVerifyFailure: function (originalId, key)
		{
			key.set('verified', 'failure');
			key.set('lastVerificationDate', Util.toDateSerializable());
			key.set('lastVerifiedMail', originalId);
			
			key.save();
		},
	};
	
});
define([
    'jquery',
    'underscore',
    ], function ($,_) {

	SignatureProcessor = {

		checkSignature: function(originalId, author, dataSigPair, callbacks)
		{
			var that = this;
			var address = Util.getAddressFromEmail(author);
			
			appSingleton.user.getKeyRing().getKeysForAllAddressesPGPLookupFirst([address], {
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
						that.onVerifyFailure(contact, key);
						callbacks.failure();
					}
				},
				failure: function () {
					that.onVerifyFailure(contact, key);
					callbacks.failure();
				},
			});
		},
		
		onVerifySuccess : function(originalId, contact, key)
		{
			key.set('verified', 'success');
			key.set('lastVerificationDate', Util.toDateSerializable());
			key.set('lastVerifiedMail', originalId);
			
			contact.set('keyStatus', { status: 'success', date: Util.toDateSerializable() });

			contact.save();
			key.save();
		},
		
		onVerifyFailure: function (contact, key)
		{
			key.set('verified', 'failure');
			key.set('lastVerificationDate', Util.toDateSerializable());
			
			contact.set('keyStatus', { status: 'failure', date: Util.toDateSerializable() });

			contact.save();
			key.save();
		},
	};
	
});
define([
    'jquery',
    'underscore',
    ], function ($,_) {

	SignatureProcessor = {

		checkSignature: function(originalId, author, data, callbacks)
		{
			var that = this;
			Crypto.signatureInfoPGP(data.signature, {
				success: function (info) {
					
					appSingleton.user.getKeyRing().getKeysForKeyIds(info.keyIds, {
						success: function(keyIdsToCrypto) {
							that.check(originalId, data, _.values(keyIdsToCrypto), callbacks);
						},
						
						failure: function () {
							// @TODO remove logging
							console.log("failed to get signature keys");
							callbacks.failure();
						}
					});
				},
				failure: callbacks.failure
			});
		},
				
		check: function (originalId, data, keys, callbacks)
		{
			var that = this;
			Crypto.verifyPGP (_.map(keys, function(key) { return key.get('publicKey'); }), data, {
				success: function (result) {
					if (result)
					{
						that.onVerifySuccess(originalId, keys);
						callbacks.success();
					}
					else
					{
						that.onVerifyFailure(originalId, keys);
						callbacks.failure();
					}
				},
				failure: function () {
					that.onVerifyFailure(originalId, keys);
					callbacks.failure();
				},
			});
		},
		
		onVerifySuccess : function(originalId, keys)
		{
			_.each(keys, function(key) {
				key.set('verified', 'success');
				key.set('lastVerificationDate', Util.toDateSerializable());
				key.set('lastVerifiedMail', originalId);
				key.save();
			});
		},
		
		onVerifyFailure: function (originalId, keys)
		{
			_.each(keys, function(key) {
				key.set('verified', 'failure');
				key.set('lastVerificationDate', Util.toDateSerializable());
				key.set('lastVerifiedMail', originalId);
				key.save();
			});
		},
	};
	
});
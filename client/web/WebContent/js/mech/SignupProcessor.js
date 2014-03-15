define([
        'jquery',
        'underscore',
        'backbone',
        ], function ($,_,Backbone) {

	SignupProcessor = {

		initialize: function(options) 
		{
		},

		process: function(name, password, callbacks)
		{
			var address = name + Constants.ATHOST;
			callbacks.step('Generating PGP keys for ' + address);
			Crypto.generatePGP ({
				
				success: function (pgp) {
					callbacks.step('Generating password based encryption and verification keys');
			       	Crypto.generatePBEs (
			       		address+"!"+password,
			       		{
			       			success: function(keys) {
			       				callbacks.step('Generating non password bound aes encryption key');
			       				Crypto.generateAES({
			       					success: function(aes) {
							       		Backbone.encryptJson (
							       			keys.aes,
							       			new Login({ 
							       				privateKeys: { 
							       					aes: aes, 
							       					pgp: pgp.privateKeyArmored, 
							       				},
							       				publicKey: pgp.publicKeyArmored,
							       				clientVersion: Constants.VERSION
							       			}).toJSON(),
							       			LoginExposedFields,
							       			{
							       				success: function(encrypted) {
								       				callbacks.step('Registering user with server');
													var now = new Date();
										    		$.ajax({ 
										    			method: 'POST',
										    			url: Constants.URL + "user/Signup?user=" + encodeURIComponent(name+Constants.ATHOST) + "&verification=" + encodeURIComponent(keys.verification) + "&nocache=" + now.valueOf(),
										    			data: JSON.stringify(encrypted)
										    		})
													.success(function ( json ) {
														
														
									       				callbacks.step('Decrypting user from server.');
														Backbone.decryptJson(
															keys.aes,
															json,
															LoginExposedFields,
															{
																success: function (json) {
												       				callbacks.step('Starting application.');
																	appSingleton.login = new Login(json);
																	
																	appSingleton.user = new User({syncId:"user"});
																	appSingleton.user.fetch();
																	
																	appSingleton.user.syncedOnce(callbacks.success);
																},
																failure: callbacks.failure
															}
														);
													})
													.fail (callbacks.failure);
							       				},
							       				failure: callbacks.failure
							       			}
							       		);
			       					},
			       					failure: callbacks.failure,
			       				});	
			       			},
			       			failure : callbacks.failure
			       		}
			       	);
				},
			 	failure: callbacks.failure
			}, address);
		}
	};
});
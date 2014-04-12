define([
        'jquery',
        'underscore',
        'backbone',
        ], function ($,_,Backbone) {

	// @TODO Login, Signup and UpdateLogin should be refactored into one class probably
	// and they should share code for the overlapping functionality
	UpdateLoginProcessor = {

		initialize: function(options) 
		{
		},
		
		getCurrentLogin: function(name, password, version, callbacks)
		{
			var address = name + Constants.ATHOST;
			
			callbacks.step('Generating old password bound encryption keys');

			Crypto.generatePBEs (
       			address+"!"+password,
	       		{
	       			success: function(keys) {
	       				callbacks.step('Getting login from server');

						var now = new Date();
			    		$.ajax({ url: Constants.URL + "user/Login?user=" + encodeURIComponent(address) + "&verification=" + encodeURIComponent(keys.verification) + "&nocache=" + now.valueOf() })
							.success(function ( json ) {
								
			       				callbacks.step('Decrypting login from server');
								Backbone.decryptJson(
									keys.aes,
									json,
									LoginExposedFields,
									{
										success: function (json) {
											var login = new Login(json);
											callbacks.success(keys.verification, login);
										},
										failure: callbacks.failure
									}
								);
							})
							.fail (callbacks.failure);
	       			},
	       			failure : callbacks.failure
	       		},
	       		Constants.PBE_PARAMS[version]
	       	);
		},
		
		updateLogin: function(oldVerification, name, password, login, callbacks)
		{
			var address = name + Constants.ATHOST;
			
			callbacks.step('Generating new password bound encryption keys');
	       	Crypto.generatePBEs (address+"!"+password, {
       			success: function(keys) {
       				
       				callbacks.step("Encrypting login with new encryption leys");
		       		Backbone.encryptJson (
		       			keys.aes,
		       			login.toJSON(),
		       			LoginExposedFields,
		       			{
		       				success: function(encrypted) {
			       				callbacks.step('Updating user on server');
								var now = new Date();
					    		$.ajax({ 
					    			method: 'POST',
					    			url: 
					    				Constants.URL + "user/Update?user=" + encodeURIComponent(address) + 
					    				"&verificationOld=" + encodeURIComponent(oldVerification) + 
					    				"&verification=" + encodeURIComponent(keys.verification) + 
					    				"&nocache=" + now.valueOf(),
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
			 	failure: callbacks.failure
			});
		},
		
		process: function(name, passwordOld, version, passwordNew, callbacks)
		{
			var that = this;
			this.getCurrentLogin(name, passwordOld, version, {
				success: function(oldVerification, login) {
					that.updateLogin(oldVerification, name, passwordNew, login, callbacks);
				},
				failure: callbacks.failure,
				step: callbacks.step,
			});
		}
	};
});
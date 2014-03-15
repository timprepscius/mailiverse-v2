define([
        'jquery',
        'underscore',
        ], function ($,_) {

	LoginProcessor = {

		initialize: function(options) 
		{
		},

		process: function(name, password, callbacks)
		{
			var address = name+Constants.ATHOST;
			
	       	Crypto.generatePBEs (
       			address+"!"+password,
	       		{
	       			success: function(keys) {
						var now = new Date();
			    		$.ajax({ url: Constants.URL + "user/Login?user=" + encodeURIComponent(address) + "&verification=" + encodeURIComponent(keys.verification) + "&nocache=" + now.valueOf() })
							.success(function ( json ) {
								Backbone.decryptJson(
									keys.aes,
									json,
									LoginExposedFields,
									{
										success: function (json) {
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
	       			failure : callbacks.failure
	       		}
	       	);
 		},

	};
	
});
define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	KeyExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
    Key = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Key',
    	exposedFields: KeyExposedFields,
    	
    	// 	attributes:
    	// 	{
    	//		publicKeyChanged: date
    	//		publicKeyOnServer: string
    	//		lookupFailed: date
    	//		verified: 'success' || 'failure'
    	//		lastVerifiedMail: id
    	// 	}
    });
    
    
	KeyFinder = Backbone.Model.extend({
		key: null,
    });
	
    
    Keys = Backbone.Collection.extend({
        model: Key,
        exposedFields: KeyExposedFields,
        user: null,
        
        initialize:function(objects, options)
        {
        	this.user = options.user;
        },
        
        getKey: function(address)
        {
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").aes, address);
        	
        	var model = this.get(addressHash);
        	if (!model)
        	{
        		model = new this.model({ syncId: addressHash }); 
        		model.fetch();
        		this.add(model);
        	}
        	
        	return model;
        },
        
        createKey: function(address)
        {
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").aes, address);
        	
        	var model = this.get(addressHash);
        	if (!model)
        	{
        		model = new this.model({ syncId: addressHash }); 
        		model.onCreate();
        		this.add(model);
        	}
        	
        	return model;
        },

        findKey: function(address)
        {
        	var keyFinder = new KeyFinder();
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").aes, address);
        	var model = this.get(addressHash);
        	if (!model || !model.isSyncedOnce())
        	{
        		model = model || new this.model({syncId: addressHash});
        		var xhr = model.fetch();
        		
        		xhr.fail( function() {
        			Util.onNextTick( function () { keyFinder.trigger('failure'); keyFinder.trigger('sync'); } );
        		});
        		
        		xhr.success ( function() {
        			Util.onNextTick( function () { keyFinder.trigger('success'); keyFinder.trigger('sync'); } );
        		});
        	}
        	else
        	{
        		// we already have the key
    			Util.onNextTick( function () { keyFinder.trigger('success'); keyFinder.trigger('sync'); } );
        	}
        	
			keyFinder.key = model;
    		return keyFinder;
        },
        
    	getKeysForAllAddresses: function(addresses, callbacks)
    	{
			var addressesToKeyFinders = {};
			var findKeyFailure = false;
			
			var onAllKeys = function () {
				var addressesToKeys = {};

				_.each (addresses, function(address) {
					addressesToKeys[address] = addressesToKeyFinders[address].key;
				});
				
				if (!findKeyFailure)
					callbacks.success(addressesToKeys);
				else
					callbacks.failure(addressesToKeys);
			};
    
			var afterAllKeys = _.after(addresses.length+1, onAllKeys);
			_.each (addresses, function(address) {
				var key = appSingleton.user.getKeyRing().findKey(address);
				addressesToKeyFinders[address] = key;
				key.on('success', afterAllKeys);
				key.on('failure', function() {
					PGPLookUp.lookup(address, {
						success: afterAllKeys,
						failure: function () {
							findKeyFailure = true;
							afterAllKeys();
						}
					});
				});
			});

			afterAllKeys();
    	},
        
    });
    
});
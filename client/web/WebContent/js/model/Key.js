define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	KeyCryptoExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
    KeyCrypto = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'KeyCrypto',
    	exposedFields: KeyCryptoExposedFields,
    	
    	// 	attributes:
    	// 	{
    	//		publicKey: string
    	// 	}
    });

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
    	url: function () { return Constants.REST + 'Keys'; },
    	
        model: Key,
        exposedFields: KeyExposedFields,
        user: null,
        
        initialize:function(objects, options)
        {
        	this.user = options.user;
        },
        
        getKey: function(address)
        {
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").hashKey, address);
        	
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
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").hashKey, address);
        	
        	var model = this.get(addressHash);
        	if (!model)
        	{
        		model = new this.model({ syncId: addressHash, address: address }); 
        		model.onCreate();
        		this.add(model);
        	}
        	
        	return model;
        },

        createKeyCrypto: function(address)
        {
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").hashKey, address);
        	var model = new KeyCrypto({ syncId: addressHash });
        	return model;
        },

        findKey: function(address)
        {
        	var keyFinder = new KeyFinder();
        	var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").hashKey, address);
        	var model = this.get(addressHash);
        	if (!model || !model.isSyncedOnce())
        	{
        		model = model || new this.model({syncId: addressHash});
        		var xhr = model.fetch();
        		
        		xhr.fail( function() {
        			Util.onNextTick( function () { keyFinder.trigger('failure'); keyFinder.trigger('sync'); } );
        		});
        		
        		xhr.success ( function() {
        			keyFinder.key = model;
        			Util.onNextTick( function () { keyFinder.trigger('success'); keyFinder.trigger('sync'); } );
        		});
        	}
        	else
        	{
    			keyFinder.key = model;

    			// we already have the key
    			Util.onNextTick( function () { keyFinder.trigger('success'); keyFinder.trigger('sync'); } );
        	}
        	
    		return keyFinder;
        },
        
        getKeyCryptosForKeys: function(addresses, callbacks)
        {
        	var addressesToCryptos = {};
        	
        	var keyFailure = false;
        	var onAllKeys = function() {
        		if (keyFailure)
        			callbacks.failure();
        		else
        			callbacks.success(addressesToCryptos);
        	};
        	
			var afterAllKeys = _.after(addresses.length+1, onAllKeys);
			_.each (addresses, function(address) {
        		var addressHash = Crypto.cryptoHash16(appSingleton.login.get("privateKeys").hashKey, address);

        		var crypto = new KeyCrypto({ syncId: addressHash });
        		crypto.fetch({
        			success: function() {
        				addressesToCryptos[address] = crypto;
        				onAllKeys();
        			},
        			error: function() {
        				keyFailure = true;
        				onAllKeys();
        			}
        		});
			});
			
			afterAllKeys();
        			
        },
        
    	getKeysForAllAddressesCachedFirst: function(addresses, callbacks)
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
						success: function (foundKey) {
							key.key = foundKey;
							afterAllKeys();
						},
						failure: function () {
							findKeyFailure = true;
							afterAllKeys();
						}
					});
				});
			});

			afterAllKeys();
    	},
        
    	getKeysForAllAddressesPGPLookupFirst: function(addresses, callbacks)
    	{
			var addressesToKeyFinders = {};
			var findKeyFailure = false;
			
			var onAllKeys = function () {
				var addressesToKeys = {};

				_.each (addresses, function(address) {
					addressesToKeys[address] = addressesToKeyFinders[address].key;
					if (!addressesToKeyFinders[address].key)
						findKeyFailure = true;
				});
				
				if (!findKeyFailure)
					callbacks.success(addressesToKeys);
				else
					callbacks.failure(addressesToKeys);
			};
    
			var afterAllKeys = _.after(addresses.length+1, onAllKeys);
			
			_.each (addresses, function(address) {
				
				PGPLookUp.lookup(address, {
					
					success: function (key) {
						var keyFinder = { key: key };
						addressesToKeyFinders[address] = keyFinder;
						afterAllKeys();
					},

					failure: function () {
						var keyFinder = appSingleton.user.getKeyRing().findKey(address);
						addressesToKeyFinders[address] = keyFinder;
						keyFinder.syncedOnce(afterAllKeys);
					},
						
				});
			});

			afterAllKeys();
    	},
    });
    
});
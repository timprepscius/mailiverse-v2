define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	KeyCryptoExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
	// KeyCrypto is the actual key block
	
    KeyCrypto = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'KeyCrypto',
    	exposedFields: KeyCryptoExposedFields,
    	
        // 	attributes:
    	// 	{
    	//      syncId: crypto hash of pgp.keyId
    	//		publicKey: string
    	// 	}
    	
    	// fetch the crypto from cache or from the pgp lookup
    	// this may need to be refactored in the near future
    	fetch: function(options)
    	{
    		if (!options.noPGPLookUp)
    		{
	    		var that = this;
	    		var errorSave = options.error;
	    		options.error = function () {
	    			PGPLookUp.lookupId(that.get('keyId'), that, {
	    				success: options.success,
	    				failure: errorSave
	    			});
	    		};
    		}
    		return Backbone.Model.prototype.fetch.apply(this, [options]);
    	},
    });

	KeyInfoExposedFields = [ 'syncId', 'syncOwner', 'syncVersion', 'addressHash' ];

	// KeyInfo is all the meta data about the key
	
	KeyInfo = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Key',
    	exposedFields: KeyInfoExposedFields,
    	
    	// 	attributes:
    	// 	{
    	//      syncId: crypto hash of pgp.keyId
    	//      keyId: pgp.keyId,
    	//      keySize: bits,
    	//		timeStamp: date,
    	//		source: string
    	//		verified: 'success' || 'failure'
    	//		lastVerifiedMail: id
    	//      keyId: id,
    	// 	}
    });
    
	// KeyChain is a set of keys for a single user id
	
	KeyChain = Backbone.Collection.extend({
        model: KeyInfo,
    	url: function () { return Constants.REST + 'Keys?field=' +this.field + "&id="+ this.id; },
    	exposedFields: KeyInfoExposedFields,
    	
        initialize:function(objects, options)
        {
        	this.address = options.address;

        	if (this.address)
        	{
            	this.field = "addressHash";
        		this.id = Crypto.cryptoHash16(this.address);
        	}
        	
        	this.user = options.user;
        },
        
        // gets current list of keyids and attributes from key server
        updateKeys: function(keys, server)
        {
        	_.each(keys, function(key) {
        		var k = this.findWhere({ keyId: key.keyId });
        		if (!k)
        		{
        			k = new KeyInfo({syncId: Crypto.cryptoHash16(key.keyId), keyId:key.keyId, addressHash:Crypto.cryptoHash16(key.address) });
        			k.onCreate();
        			this.add(k);
        		}
        		
        		k.set(key);
        		k.set('source', server);
        		k.save();
        		
        	}, this);
        },
        
        createKey: function(attributes)
        {
        	var keyIdHash = Crypto.cryptoHash16(attributes.keyId);
        	
        	var model = this.get(keyIdHash);
        	if (!model)
        	{
        		model = new this.model({ syncId: keyIdHash }); 
        		model.onCreate();
        		this.add(model);
        	}
    		model.set(attributes);
    		
    		return model;
        },
        
        getKey: function(keyId)
        {
        	return this.findWhere({ keyId: keyId });
        },

        getCrypto: function(keyId)
        {
        	return new KeyCrypto({ syncId: Crypto.cryptoHash16(keyId), keyId: keyId });
        },
    	
    	getPrimaryKeyId: function() {
    		// just pick first for right now.
    		// I should probably pick latest, or greatest or something
    		if (this.length > 0)
    			return this.models[0].get('keyId');
    		
    		return null;
    	},
    	
    	fetch: function(options)
    	{
    		if (!options.noPGPLookUp && this.address)
    		{
        		var that = this;
	    		var errorSave = options.error;
	    		var successSave = options.success;

	    		options.error = function () {
	    			PGPLookUp.lookupAddress(that.address, that, {
	    				success: successSave,
	    				failure: errorSave
	    			});
	    		};
	    		
	    		options.success = function() {
	    			if (that.length==0)
	    				options.error();
	    			else
	    				successSave();
	    		};
    		}
    		
    		return Backbone.Model.prototype.fetch.apply(this, [options]);
    	},
    	
    });	
	
	KeyFinder = Backbone.Model.extend({
		key: null,
    });
	
	KeyRing = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Keys'; },
    	
        exposedFields: KeyInfoExposedFields,
        user: null,
        
        initialize:function(objects, options)
        {
        	this.user = options.user;
        },
        
        getKeyChain: function(address)
        {
        	return new KeyChain([], { address: address }); 
        },
        
        getKeyCryptosForKeyIds: function(ids, callbacks)
        {
        	var keyIdsToCryptos = {};
        	
        	var keyFailure = false;
        	var onAllKeys = function() {
        		if (keyFailure)
        			callbacks.failure();
        		else
        			callbacks.success(keyIdsToCryptos);
        	};
        	
			var afterAllKeys = _.after(ids.length+1, onAllKeys);
			_.each (ids, function(id) {
        		var idHash = Crypto.cryptoHash16(id);

        		var crypto = new KeyCrypto({ syncId: idHash, keyId:id });
        		crypto.fetch({
        			success: function() {
        				keyIdsToCryptos[id] = crypto;
        				afterAllKeys();
        			},
        			error: function() {
        				keyFailure = true;
        				afterAllKeys();
        			}
        		});
			});
			
			afterAllKeys();
        },
        
        getKeyCryptosForAddresses: function(addresses, callbacks)
        {
        	var that = this;
        	var addressesToCryptos = {};
        	var keyFailure = false;
        	
			var afterAllKeys = _.after(addresses.length+1, function() {
        		if (keyFailure)
        			callbacks.failure();
        		else
        			callbacks.success(addressesToCryptos);
        	});
        	
        	var onFailure = function() {
				keyFailure = true;
				afterAllKeys();
        	};
        	
			_.each (addresses, function(address) {
				
				var keyChain = that.getKeyChain(address);
				
				keyChain.fetch({
					success: function() {
						var keyId = keyChain.getPrimaryKeyId();
						var crypto = keyChain.getCrypto(keyId);
						
						crypto.fetch({
							success: function() {
								addressesToCryptos[address] = crypto;
								afterAllKeys();
							},
							error: onFailure
						});
					},
					error: onFailure
				});
			});
			
			afterAllKeys();
        },

        getKeyInfoForAddresses: function(addresses, callbacks)
        {
        	var that = this;
        	var addressesToInfos = {};
        	
        	var keyFailure = false;
    		var afterAllKeys = _.after(addresses.length+1, function() {
        		if (keyFailure)
        			callbacks.failure();
        		else
        			callbacks.success(addressesToInfos);
        	});
    		
        	var onFailure = function() {
    			keyFailure = true;
    			afterAllKeys();
        	};
        	
    		_.each (addresses, function(address) {
    			
    			var keyChain = that.getKeyChain(address);
    			
    			keyChain.fetch({
    				success: function() {
    					var info = keyChain.getKey(keyChain.getPrimaryKeyId());
    					addressesToInfos[address] = info;
    					
    					if (info)
    						afterAllKeys();
    					else
    						onFailure();
    				},
    				error: onFailure
    			});
    		});
    		
    		afterAllKeys();
        },
        
    });

});
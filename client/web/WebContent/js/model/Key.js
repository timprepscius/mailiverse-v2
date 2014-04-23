define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	KeyExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
	// Key is the actual key block
	
    Key = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Key',
    	exposedFields: KeyExposedFields,
    	
        // 	attributes:
    	// 	{
    	//      syncId: crypto hash of pgp.keyId
    	//		publicKey: string
    	// 	}
    	
    	generateInfo: function (server, callbacks)
    	{
    		var that = this;
			Crypto.infoPGP(this.get('publicKey'), {
				success: function (info) {
					info.source = server;
					
					var keyChain = appSingleton.user.getKeyRing().getKeyChain(info.address);
					keyChain.fetchOrCreate();
					keyChain.syncedOnce(function() {
						keyChain.updateKeys([info], server, false);
						callbacks.success(keyChain);
					});
				},
				failure: callbacks.failure
			});
    	},
    	
    	// fetch the crypto from cache or from the pgp lookup
    	// this may need to be refactored in the near future
    	fetch: function(options)
    	{
    		if (!options.noPGPLookUp)
    		{
	    		var that = this;
	    		var errorSave = options.error || function() {};
	    		options.error = function () {
	    			PGPLookUp.lookupId(that.get('keyId'), that, {
	    				success: function (server) {
	    					that.generateInfo(server, {
	    						success: options.success || function() {},
	    						failure: errorSave
	    					});
	    				},
	    				failure: errorSave
	    			});
	    		};
    		}
    		return Backbone.Model.prototype.fetch.apply(this, [options]);
    	},
    });

	// KeyInfo is all the meta data about the key
	KeyInfo = Backbone.Model.extend({
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
		
		initialize: function(attrs, options)
		{
			this.parentKeyChain = options.parentKeyChain;
		},
		
		save: function()
		{
			this.parentKeyChain.onKeyModification(this);
		},
    });
    
	// KeyChain is a set of keys for a single user id
	
	KeyChainExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	KeyChain = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'KeyChain',
    	exposedFields: KeyChainExposedFields,
    	
        // gets current list of keyids and attributes from key server
        updateKeys: function(keys_, server, all)
        {
        	var keys = this.get('keys') || {};
        	
        	_.each(keys_, function(key) {
				var k = keys[key.keyId] || {};
        		$.extend(k, key);
				keys[key.keyId] = k;
        	});
        	
        	this.set('keys', keys);
        	if (all)
        		this.markTimeStamp(server);
        	
        	this.save();
        },
        
        getKey: function(keyId)
        {
        	return new KeyInfo(this.get('keys')[keyId], { parentKeyChain: this });
        },

        getCrypto: function(keyId)
        {
        	return new Key({ syncId: Crypto.cryptoHash16(keyId), keyId: keyId });
        },
    	
    	getPrimaryKeyId: function() 
    	{
    		// pick the latest non revoked key.
    		// i think what will eventually happen, is the keyId of the email last received by the 
    		// recipient should be given preference.
    		// @TODO, use some better algorithm to pick best key for user
    		var bestKey = null;
    		
    		var keys = this.get('keys');
    		_.each(keys, function(key) {
    			if (!key.revoked)
    			{
	    			if (bestKey == null || key.timeStamp > bestKey.timeStamp)
	    				bestKey = key;
    			}
    		});

    		return bestKey ? bestKey.keyId : null;
    	},
    	
    	onKeyModification: function(key)
    	{
    		var json = key.toJSON();
    		this.updateKeys([json], null, false);
    	},
    	
    	needsToBeUpdated: function ()
    	{
    		if (this.has('updateTimeStamp'))
    		{
    			var then = Util.fromDateSerializable(this.get('updateTimeStamp'));
    			var now = new Date();
    			if ((now.getTime() - then.getTime()) / 1000 > 60 * 60 * 24)
    				return true;
    			
    			return false;
    		}
    		return true;
    	},
    	
    	includesUserSource: function()
    	{
        	var keys = this.get('keys') || {};
        	var user = false;
        	_.each(keys, function(key) {
        		if (key.source == 'user')
        			user = true;
        	});
    		
        	return user;
    	},
    	
    	includesAKey: function()
    	{
        	var keys = this.get('keys') || {};
    		return keys.length > 0;
    	},
    	
    	markTimeStamp: function(server)
    	{
    		this.set('updateTimeStamp', Util.toDateSerializable());
    		this.set('updateSource', server);
    	},
    	
    	fetch: function(options)
    	{
    		if (!options.noPGPLookUp)
    		{
        		var that = this;
	    		var errorSave = options.error || function() {};
	    		var successSave = options.success || function() {};

	    		options.error = function () {
	    			PGPLookUp.lookupAddress(that.get('address'), that, {
	    				success: successSave,
	    				failure: function () {
	    					
	    					// if the PGPLookUp fails
	    					if (that.includesUserSource())
	    					{
	    						that.markTimeStamp('user', new Date());
	    						that.save();
	    						
	    						successSave();
	    					}
	    					else
	    					// the PGPLookup failed, but the server might be down
	    					// so let's try to do it anyways??
	    					// @TODO clarify what to do if PGPServer is down
	    					if (that.includesAKey())
	    					{
	    						successSave();
	    					}
	    					// PGPLookUpFailed and there is *NO* key.
	    					else
	    					{
	    						errorSave();
	    					}
	    				}
	    			});
	    		};
	    		
	    		options.success = function() {
	    			if (that.needsToBeUpdated())
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
    	url: function () { return Constants.REST + 'KeyChains'; },
    	
        exposedFields: KeyChainExposedFields,
        user: null,
        model: KeyChain,
        
        initialize:function(objects, options)
        {
        	this.user = options.user;
        },
        
        getKeyChain: function(address)
        {
        	return new KeyChain({ syncId: Crypto.cryptoHash16(address), address: address }); 
        },
        
        createKey: function(publicKey, info)
        {
        	return new Key({ syncId: Crypto.cryptoHash16(info.keyId), keyId: info.keyId, publicKey: publicKey });
        },
        
        getKeysForKeyIds: function(ids, callbacks)
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

        		var crypto = new Key({ syncId: idHash, keyId:id });
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
        
        getKeysForAddresses: function(addresses, callbacks)
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
				
				function getCrypto(keyId)
				{
					var crypto = new Key({ syncId: Crypto.cryptoHash16(keyId), keyId: keyId });
					
					crypto.fetch({
						success: function() {
							addressesToCryptos[address] = crypto;
							afterAllKeys();
						},
						error: onFailure
					});
					
				}
				
				var specificKeyId = Util.getSpecificKeyFromKeyedEmail(address);
				if (specificKeyId)
				{
					getCrypto(specificKeyId);
				}
				else
				{
					var keyChain = that.getKeyChain(Util.getAddressFromEmail(address));
					
					keyChain.fetch({
						success: function() {
							var keyId = keyChain.getPrimaryKeyId();
							getCrypto(keyId);
						},
						error: onFailure
					});
				}
			});
			
			afterAllKeys();
        },

        getKeyChainsForAddresses: function(addresses, callbacks)
        {
        	var that = this;
        	var addressesToInfos = {};
        	
        	var keyFailure = false;
    		var afterAllKeys = _.after(addresses.length+1, function() {
        		if (keyFailure)
        			callbacks.failure(addressesToInfos);
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
    					addressesToInfos[address] = keyChain;
    					
						afterAllKeys();
    				},
    				error: onFailure
    			});
    		});
    		
    		afterAllKeys();
        },
        
    });

});
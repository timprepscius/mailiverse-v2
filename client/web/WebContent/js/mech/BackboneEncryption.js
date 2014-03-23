define([
	'jquery',
	'underscore',
	'backbone',
	'dispatch',
], function ($,_,Backbone) {
	
	Backbone.decryptJsonItem = function(aes, json, exposedFields, callbacks) 
	{
		// objects provided by the server will not have an encrypted portion
		if (json.encrypted)
		{
			Crypto.decryptAESBlock(aes, json.encrypted, {
				success: function(decryptedBlock) {
					var decrypted = decryptedBlock ? JSON.parse(decryptedBlock) : {};
					
					_.each(exposedFields, function(field) { 
						if (_.has(json,field)) 
							decrypted[field] = json[field]; 
					});
					
					callbacks.success(decrypted);
				},
				
				failure: callbacks.failure
			});
		}
		else
		{
			callbacks.success(json);
		}
	};
	
	Backbone.decryptJsonItems = function(aes, jsons, exposedFields, callbacks) {
		var results = [];
		
		var encryptedBlocks = _.map(jsons, function(json) { return json.encrypted; });
		Crypto.decryptAESBlocks(aes, encryptedBlocks, {
			success: function (decryptedBlocks) {
				while (jsons.length)
				{
					try
					{
						var json = jsons.shift();
						var decryptedBlock = decryptedBlocks.shift();
						var decrypted = decryptedBlock ? JSON.parse(decryptedBlock) : {};
						
						_.each(exposedFields, function(field) { 
							if (_.has(json,field)) 
								decrypted[field] = json[field]; 
						});
						
						results.push(decrypted);
					}
					catch (exception)
					{
						console.log("caught exception during decryption, CryptoJS doesn't handle 0 length blocks correctly");
					}
				}
				
				callbacks.success(results);
			},
			
			failure: callbacks.failure
			
		});
		
	};
	
	Backbone.decryptJson = function(aes, json, exposedFields, callbacks) 
	{
		if (_.isArray(json))
			return Backbone.decryptJsonItems(aes, json, exposedFields, callbacks);
		else
			return Backbone.decryptJsonItem(aes, json, exposedFields, callbacks);
	};

	Backbone.encryptJson = function(aes, data, exposedFields, callbacks) {
		var json = {};
		
		if (data)
		{
			// copy the exposed fields
			_.each(exposedFields, function(field) { 
				if (_.has(data,field)) 
					json[field] = data[field]; 
			});
			
			var plainText = JSON.stringify(_.omit(data, exposedFields));
			if (plainText.length < 2)
				alert('woah');
			
			Crypto.encryptAESBlock(aes, plainText, {
				success: function(encryptedBlock) {
					json.encrypted = encryptedBlock;
					callbacks.success(json);
				},
				
				failure: callbacks.failure,
			});
		}
	};
	
	//---------------------------------------------------------------------
	//---------------------------------------------------------------------
	//---------------------------------------------------------------------	
	
	var ajax_save = Backbone.ajax;
	Backbone.ajax = function(params, options) {
		var success_save = params.success;
		params.success = function () {
			var successArguments = arguments;
			
			Backbone.decryptJson(
				appSingleton.login.get('privateKeys').aes,	
				successArguments[0],
				params.exposedFields,
				{
					success: function(decrypted) {
						successArguments[0] = decrypted;
						success_save.apply(this, successArguments);
					},
					failure: function() {
						if (params.failure)
							params.failure(arguments);
					}
				}
			);
		};
		
		return ajax_save(params,options);
	} ;
	
	var sync_save = Backbone.sync;
	Backbone.sync = function(method, model, options) {
		options = options || {};
		options.exposedFields = this.exposedFields;

		if (method === 'create' || method === 'update' || method === 'patch')
		{
			options.contentType = 'application/json';
			
			Backbone.encryptJson(
				appSingleton.login.get('privateKeys').aes,
				this.toJSON(model),
				options.exposedFields,
				{
					success: function (encrypted) {
						options.data = JSON.stringify(encrypted);
						sync_save.apply(this, [method, model, options]);
					},
					failure: function() {
						if (options.failure)
							options.failure(arguments);
					}
				}
			);
		}
		else
		{
			return sync_save.apply(this, [method, model, options]);
		}
	};
	
	
});
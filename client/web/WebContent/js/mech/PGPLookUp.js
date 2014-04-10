define([
    'jquery',
    'underscore',
    ], function ($,_) {

	PGPLookUp = {

		lookupId: function(id, model, callbacks)
		{
			model = model || new Key({ syncId: Crypto.cryptoHash16(id), keyId:id});
			var server = Constants.PGP_SERVERS[0];
			
			$.ajax(server + "?op=get&options=mr&search=0x" + id)
				.success(function(response) {
					model.set('publicKey', response);
					model.save();
					
					callbacks.success(server);
				})
				.fail(callbacks.failure);
		},
			
		lookupAddress: function(address, model, callbacks)
		{
			if (!address || !address.match(/.+@.+/))
				return callbacks.failure();
			
			this.doLookup(address, {
				success: function (keys, server) {
					model.updateKeys(keys, server, true);
					callbacks.success(model);
				},
				failure: callbacks.failure
			});
		},
		
		doLookup: function (address, callbacks)
		{
			var that = this;
			var server = Constants.PGP_SERVERS[0];
			var url = server;
			var lookupAddress = "<" + address + ">";
			
			$.ajax(url + "?op=index&exact=on&options=mr&search=" + lookupAddress)
				.success(function(response) { that.parseLookUpIndex(server, address, response, callbacks); })
				.fail(callbacks.failure);
		},
		
		parseLookUpIndex: function(server, address, response, callbacks)
		{
			var keys = [];
			var key = null;
			
	    	var lines = response.split("\n");
	    	for (var i in lines)
	    	{
	    		var line = lines[i].trim();
	    		if (line.startsWith("info:"))
	    		{
	    		}
	    		else
	    		if (line.startsWith("pub:"))
	    		{
	    			var parts = line.split(":");
	    			if (key != null && key.userId.contains(address))
	    				keys.push(key);
	    			
	    			key = {};
	    			
	    			key.keyId = parts[1].toLowerCase();
	    			key.keySize = parts[3];
	    			key.timeStamp = parseInt(parts[4]);
	    			key.revoked = line.endsWith(":r");
	    			key.address = address;
	    		}
	    		
	    		else
	    		if (line.startsWith("uid:"))
	    		{
	    			var parts = line.split(":");
	    			var uid = parts[1];
	    			if (uid.contains(address))
	    				key.userId = parts[1];
	    		}
	    	}
	    	
			if (key != null && key.userId.contains(address))
				keys.push(key);

			if (keys.length)
	    	{
	    		callbacks.success(keys, server);
	    	}
	    	else
	    	{
	    		callbacks.failure();
	    	}
		},
	};
	
});
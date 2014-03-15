define([
    'jquery',
    'underscore',
    ], function ($,_) {

	PGPLookUp = {

		lookup: function(address, callbacks)
		{
			if (!address.match(/.+@.+/))
				return callbacks.failure();
			
			var lookupAddress = "<" + address + ">";
			
			this.doLookup(lookupAddress, {
				success: function (publicKey, server) {
					var keyFinder = appSingleton.user.getKeyRing().findKey(address);
					keyFinder.syncedOnce(function() {
						var key = keyFinder.key || appSingleton.user.getKeyRing().createKey(address);
						if (publicKey != key.get('publicKey'))
						{
							key.set('publicKeyChanged', Util.getDateString());
							key.set('publicKeyOnServer', server);
							key.set('publicKey', publicKey);
							key.save();
						}
						
						callbacks.success(key);
					});
				},
				failure: callbacks.failure
			});
		},
		
		doLookup: function (address, callbacks)
		{
			var that = this;
			var server = Constants.PGP_SERVERS[0];
			var url = server;
			$.ajax(url + "?op=index&exact=on&options=mr&search=" + address)
				.success(function(response) { that.parseLookUpIndex(server, address, response, callbacks); })
				.fail(callbacks.failure);
		},
		
		parseLookUpIndex: function(server, address, response, callbacks)
		{
	    	var info = null;
	    	var pub = null;
	    	var uid = null;
	    	var found = false;
	    	var lines = response.split("\n");
	    	for (var i in lines)
	    	{
	    		var line = lines[i];
	    		if (line.startsWith("info:"))
	    			info = line;
	    		else
	    		if (line.startsWith("pub:"))
	    			pub = line;
	    		else
	    		if (line.startsWith("uid:"))
	    			uid = line;
	    		
	    		if (uid!=null && uid.toLowerCase().contains(address) &&
	    			pub!=null && !pub.endsWith(":r"))
	    		{
	    			found = true;
	    			break;
	    		}
	    	}
	    	
	    	if (!found)
	    	{
	    		callbacks.failure("Could not find address");
	    	}
	    	else
	    	{
	    		var pubParts = pub.split(":");
	    		var publicKeyId = pubParts[1];
	    		
	    		this.lookupPublicKey(server, address, publicKeyId, callbacks);
	    	}
		},
		
		lookupPublicKey: function(server, address, publicKeyId, callbacks)
		{
			var url = server;
			$.ajax(url + "?op=get&options=mr&search=0x" + publicKeyId)
				.success(function(response) { callbacks.success(response, server); })
				.fail(callbacks.failure);
		},
	};
	
});
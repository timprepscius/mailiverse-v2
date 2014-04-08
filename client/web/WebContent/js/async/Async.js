define(['dispatch'], function() {
	
Async = 
{	
	crypt_seedRandom: function(callback) { Dispatch.dispatch('crypt_seedRandom', arguments); },

	pgp_genKeyPair: function(callback) { Dispatch.dispatch('pgp_genKeyPair', arguments); },
	
	pgp_encrypt: function(callback, key, bytes64) { 
		Dispatch.dispatch('pgp_encrypt_serialized_key', arguments); 
	},

	pgp_decrypt: function(callback, key, bytes64) { 
		Dispatch.dispatch('pgp_decrypt_serialized_key', arguments); 
	},
	
	pgp_verify: function(callbacks) { Dispatch.dispatch('pgp_verify', arguments); },
	pgp_sign: function(callbacks) { Dispatch.dispatch('pgp_sign', arguments); },
	pgp_info: function(callbacks) { Dispatch.dispatch('pgp_info', arguments); },
	pgp_signature_info: function(callbacks) { Dispatch.dispatch('pgp_signature_info', arguments); },
	
	pbe_genKey: function(callback) { Dispatch.dispatch('pbe_genKey', arguments); },

	rsa_genKeyPair: function(callback) { Dispatch.dispatch('rsa_genKeyPair', arguments); },
	rsa_getPrivateKey: function(callback) { Dispatch.dispatch('rsa_getPrivateKey', arguments); },
	rsa_getPublicKey: function(callback) { Dispatch.dispatch('rsa_getPrivateKey', arguments); },
	sha256_hash: function(callback, bytes64) { Dispatch.dispatch('sha256_hash', arguments); },
	sha1_hash: function(callback, bytes64) { Dispatch.dispatch('sha1_hash', arguments); },
	sha1_hmac: function(callback, key64, bytes64) { Dispatch.dispatch('sha1_hmac', arguments); },
	zip_inflate: function(callback, data64) { Dispatch.dispatch('zip_inflate', arguments); },
	zip_deflate: function(callback, data64) { Dispatch.dispatch('zip_deflate', arguments); },
	
	aes_encrypt_multi: function(callback, key64, blocks) { Dispatch.dispatch('aes_encrypt_multi', arguments); },
	aes_decrypt_multi: function(callback, key64, blocks) { Dispatch.dispatch('aes_decrypt_multi', arguments); },
	aes_generate: function(callback) { Dispatch.dispatch('aes_generate', arguments); },
	
	rsa_encrypt: function(callback, key, bytes64) { 
		if (Dispatch.mode == 'native')
			Dispatch.dispatch('rsa_encrypt_serialized_key', [callback, hex2b64(key.genX509()), bytes64]); 
		else
			Dispatch.dispatch('rsa_encrypt_serialized_key', [callback, key.serialize(), bytes64]); 
	},

	rsa_decrypt: function(callback, key, bytes64) { 
		if (Dispatch.mode == 'native')
			Dispatch.dispatch('rsa_decrypt_serialized_key', [callback, hex2b64(key.genPKCS1()), bytes64]); 
		else
			Dispatch.dispatch('rsa_decrypt_serialized_key', [callback, key.serialize(), bytes64]); 
	},
	
	srp_dispatch: function(cmd, callback, state, arg) {
		var originalCallback = callback;
		var originalState = state;
		var srpCallback = {
			invoke: function(data) {
				if (data instanceof Error)
				{
				}
				else
				{
					var newState = data;
					if (newState != originalState)
						for (var i in newState)
							originalState[i] = newState[i];
				}
				originalCallback.invoke(data);
			}
		};

		Dispatch.dispatch(cmd, [srpCallback, state, arg]);
	},

	srp_client_setSalt: function(callback, state, arg) { mAsync.srp_dispatch('srp_client_setSalt',callback, state, arg); },
	srp_client_setServerPublicKey: function(callback, state, arg) { mAsync.srp_dispatch('srp_client_setServerPublicKey',callback, state, arg); },
	srp_client_validateServerEvidence: function(callback, state, arg) { mAsync.srp_dispatch('srp_client_validateServerEvidence',callback, state, arg); },

	ping: function()
	{
		return 'ping';
	}
	
};

});



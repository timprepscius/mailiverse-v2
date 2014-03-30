define([
	'jquery',
	'underscore',
 	'openpgp',
	'async',
	'base64',
	'base16',
	'sjcl',
	'aes',
	'js/crypt/Utf',
], function ($,_, openpgp) {

	var MIN_SIZE_RANDOM_BUFFER = 40000;
	var MAX_SIZE_RANDOM_BUFFER = 60000;

	window.openpgp = openpgp;
	window.openpgp.crypto.random.randomBuffer.init(MAX_SIZE_RANDOM_BUFFER);
	
	Crypto = {
		seedRandom: function (callbacks) {
			$.ajax(Constants.URL + 'util/Random?size='+MAX_SIZE_RANDOM_BUFFER)
				.success(function(text) {
					Async.crypt_seedRandom({success: callbacks.success, failure:callbacks.failure}, text);
				})
				.fail(callbacks.fail);
		},
			
		generatePGP: function(callbacks, address) {
			var KEY_TYPE_RSA = 1;
			var KEY_SIZE = 2048;
			
			Async.pgp_genKeyPair(callbacks, KEY_TYPE_RSA, KEY_SIZE, Util.getNameFromEmail(address) + " <" + address + ">");
		},
		
		decryptPGP: function (data, callbacks) {
			Async.pgp_decrypt(callbacks, appSingleton.login.get('privateKeys').pgp, data);
		},
		
		encryptPGP: function (publicKeys, data, shouldSign, callbacks) {
			Async.pgp_encrypt(callbacks, appSingleton.login.get('privateKeys').pgp, publicKeys, data, shouldSign);
		},
		
		signPGP: function (data, callbacks) {
			Async.pgp_sign(callbacks, appSingleton.login.get('privateKeys').pgp, data);
		},

		verifyPGP: function (pgp, data, callbacks) {
			Async.pgp_verify(callbacks, pgp, data);
		},
		
		infoPGP: function (pgp, callbacks) {
			Async.pgp_info(callbacks, pgp);
		},
		
		generatePBEs: function(password, callbacks) {
			var verificationSalt64 = Constants.VERIFICATION_SALT64;
			var encryptionSalt64 = Constants.ENCRYPTION_SALT64;
			var iterationCount = 32764;
			var keyLength = 256;
			
			Async.pbe_genKey(
				{
					success: function(verificationKey) {
						Async.pbe_genKey(
							{
								success: function(aes) {
									callbacks.success({ aes: aes, verification: verificationKey });
								},
								failure: callbacks.failure
							},
							password, verificationSalt64, iterationCount, keyLength
						);
					},
					fail: callbacks.failure
				},
				password, encryptionSalt64, iterationCount, keyLength
			);
		},
		
		generateAES: function(callbacks) {
			Async.aes_generate(callbacks);
		},
		
		decryptAESBlock: function (aes, encryptedBlock, callbacks) {
			this.decryptAESBlocks (aes, [encryptedBlock], {
				success: function(decryptedBlocks) {
					callbacks.success(decryptedBlocks[0]);
				},
				failure: callbacks.failure
			});
		},
		
		decryptAESBlocks: function(aes, encryptedBlocks, callbacks) {
			Async.aes_decrypt_multi(
				callbacks,
				aes,
				encryptedBlocks
			);
		},

		encryptAESBlock: function (aes, block, callbacks) {
			this.encryptAESBlocks (aes, [block], {
				success: function(encryptedBlocks) {
					callbacks.success(encryptedBlocks[0]);
				},
				failure: callbacks.failure
			});
		},
		
		encryptAESBlocks: function(aes, blocks, callbacks) {
			Async.aes_encrypt_multi(
				callbacks,
				aes,
				blocks
			);
		},
		
		
		cryptoHash64: function(aes, block) {
			// @TODO get rid of this, just a hack for debugging
			aes = aes || "none";
			return Support.sha256_hash(Base64.encode(Utf.toBytes(aes + "!" + block)));
		},
		
		cryptoHash16: function(aes, block) {
			return Base16.encode(Base64.decode(this.cryptoHash64(aes,block)));
		},
		
/*		
		nullIV: Base64.encode(Base16.decode("00000000")),
		
		cryptoHash64: function(aes, block) {
			return Support.aes_encrypt(aes, this.nullIV, block);
		},
		
		cryptoHash16: function(aes, block) {
			return Base16.encode(Base64.decode(this.cryptoHash64(aes,block)));
		},
		
		cryptoDehash64: function(aes, block) {
			return Support.aes_decrypt(aes, this.nullIV, block);
		},
		
		cryptoDehash16: function(aes, block) {
			return this.cryptoDehash64(aes, Base64.encode(Base16.decode(block)));
		},
		
*/
	} ;
});
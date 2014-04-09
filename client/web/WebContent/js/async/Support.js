Support = {

crypt_seedRandom: function(text)
{
	window.openpgp.crypto.random.randomBuffer.set(Base64.bytesToBuffer(Base64.decode(text)));
	window.sjcl.random.addEntropy(text, text.length*2/3, "external");
	return "ok";
},
		
rsa_getPrivateKey: function(pem64)
{
	var pem = pem64;
	var key = new RSAKey();
	key.readPrivateKeyFromPEMString(pem);
	return key;
},

rsa_getPublicKey: function(pem64)
{
	var pem = pem64;
	var key = new X509();
	key.readCertPEM(pem);
	return key.subjectPublicKeyRSA;
},

rsa_tests: function()
{
	console.log("testing 128");
	Support.rsa_testKeyPair(rsa_genKeyPair(128));

	console.log("testing 256");
	Support.rsa_testKeyPair(rsa_genKeyPair(256));

	console.log("testing 512");
	Support.rsa_testKeyPair(rsa_genKeyPair(512));

	console.log("testing 2048");
	Support.rsa_testKeyPair(rsa_genKeyPair(2048));
	
	console.log("testing 1024");
	Support.rsa_testKeyPair(rsa_genKeyPair(1024));

	console.log("testing finished");
},

rsa_genKeyPair: function(bits)
{
	var key = new RSAKey();
	key.generate(bits, "10001"); // hex 65537
	
	var privHex = key.genPKCS1();
	var pubHex = key.genX509();
	
	var priv = hex2b64(privHex);
	var pub = hex2b64(pubHex);
	
	var result = { publicKey: pub, privateKey: priv } ;
	return result;
},

pgp_genKeyPair : function(type, bits, userId, password)
{
    var data = window.openpgp.generateKeyPair(type, bits, userId, password);
    data.key = data.key.toPacketlist();
    return data;
},

pgp_encrypt: function(privateKey, publicKey, bytes64)
{
	return Base64.encode(window.openpgp.write_encrypted_message(key,Base64.decode(bytes64)));
},

pgp_info: function(keyS)
{
	var key = window.openpgp.key.readArmored(keyS).keys[0];
	return { user:key.users[0].userId.userid, keyId:key.keyId.toHex() };
},

pgp_signature_info: function(signatureS)
{
	var armoredText = "-----BEGIN PGP SIGNED MESSAGE-----\n\n" + signatureS;
	var input = window.openpgp.armor.decode(armoredText);
	var packetlist = new window.openpgp.packet.List();
	packetlist.read(input.data);
	
	var c = packetlist.filterByTag(window.openpgp.enums.packet.signature);
	if (!c || c.length == 0)
	{
		// @TODO check javascript throw syntax
		throw "no key signers in signature";
	}
	
	var keyIds = [];
	for (var i=0; i<c.length; ++i)
	{
		var hex = c[i].issuerKeyId.toHex()
		// EC511F51F2B01195
		// 1234567812345678
		if (hex.length == 16)
			hex = hex.substr(8);
		
		keyIds.push(hex.toLowerCase());
	}
	
	return { keyIds:keyIds };
},

pgp_verify: function(armoredKeys, data)
{
	// it is a signed message signature block
	
	var valid = false;

	var keys = _.map(armoredKeys, function(k) {
		return window.openpgp.key.readArmored(k).keys[0];
	});
	
	if (data.armoredText)
	{
		var message = window.openpgp.cleartext.readArmored(data.armoredText);
		var result = window.openpgp.verifyClearSignedMessage(keys,message);
		valid = result.signatures.length >= keys.length && result.signatures[0].valid;
		
		if (!valid)
		{
			console.log(data.armoredText);
			console.log(data.signature);
			console.log("not-valid");
		}
	}
	else
	{
		// i'm having problems getting the signature with openpgpjs, so I make a fake message and 
		// then get the signature from that

		var armoredText = "-----BEGIN PGP SIGNED MESSAGE-----\n\n" + data.signature;
		var input = window.openpgp.armor.decode(armoredText);
		var packetlist = new window.openpgp.packet.List();
		packetlist.read(input.data);
		
		var test = function (binary) {

			var message = new window.openpgp.cleartext.CleartextMessage(data.clearText, packetlist);
			// the message kills text on the end of lines, which kills the signatures
			// so I need to reinitialize the text to what it should be
			if (binary)
				message.text = data.clearText;
			
			// this does not work, because openpgpjs is normalizing line endings
			//var result = message.verify([key]);
			
			// set up a binary version of verify
			var verify = function(a) {
				var i = window.openpgp.enums;
				var h = window.openpgp.packet;
				var u = window.openpgp.util;
	
	            var b = [], c = this.packets.filterByTag(i.packet.signature), d = new h.Literal;
	            
	            if (binary)
	            {
	            	// the set text is also killing \r
		            d.setText = function(a) {
		//            	this.data = "utf8" == this.format ? u.encode_utf8(a) : a
			        	this.data = a;
		            };
		            
		            // getText doesn't seem to be used, but also kills \r
		            d.getText = function() {
		            	return this.data;
		            }
	            }
	            
	            return d.setText(this.text), a.forEach(function(a) {
	                for (var e = 0; e < c.length; e++) {
	                    var f = a.getPublicKeyPacket([c[e].issuerKeyId]);
	                    if (f) {
	                        var g = {};
	                        g.keyid = c[e].issuerKeyId, g.valid = c[e].verify(f, d), b.push(g);
	                        break;
	                    }
	                }
	            }), b
	        }
			
			// @TODO I should check all of the signatures
			var result = verify.apply(message, [keys]);
			valid = result.length > 0 && result[0].valid;
			
			return valid;
		}
		
		// I think I will eventually use the signatureType to determine what to do
		// but for now just test both.
		valid = test(false) || test(true);
		
		// some of the tests are coming in with just \n but their signature
		// needs \r\n, not sure if this is a problem somewhere else in the pipe line or not
		// but for now - readd the \r\n and test again
		if (!valid)
		{
			data.clearText = data.clearText.replace(/\n/gm,"\r\n");
			valid = test(false) || test(true);
		}

		if (!valid)
		{
			console.log(data.clearText);
			console.log(data.signature);
			console.log("not-valid");
		}
	}

	return valid;
},

pgp_sign: function(privateKeyS, data)
{
	var privateKey = window.openpgp.key.readArmored(privateKeyS).keys[0];
	privateKey.decrypt();
	var result = window.openpgp.signClearMessage([privateKey], data);
	return result;
},

pgp_encrypt_serialized_key: function(privateKeyS, publicKeyS, text, shouldSign)
{
	var privateKey = window.openpgp.key.readArmored(privateKeyS).keys[0];
	var publicKeys = _.map(publicKeyS, function(keyS) { 
		var keys_ = window.openpgp.key.readArmored(keyS).keys;
		return keys_[0];
	});
	privateKey.decrypt();
	
	var result = 
		shouldSign ?
			window.openpgp.signAndEncryptMessage(publicKeys, privateKey, text) :
			window.openpgp.encryptMessage(publicKeys, text);
			
	return result;
},

pgp_decrypt: function(key, bytes64)
{
	return Base64.encode(window.openpgp.read_encrypted_message(key,Base64.decode(bytes64)));
},

pgp_decrypt_serialized_key: function(keyS, bytes64)
{
	var key = window.openpgp.key.readArmored(keyS).keys[0];
	// no password for now??
	key.decrypt();
	
	var message = window.openpgp.message.readArmored(bytes64);
	var d = message.decrypt(key);
	return d.getLiteralData();
//	return Utf.toString(Utf.fromBinString(d.getLiteralData()));
	
	// this decrpytMessage is getting rid of the CR from CRLF, but sometimes the CR is necessary during
	// testing a signature,  not sure of implications
//	return window.openpgp.decryptMessage(key,message);
},

rsa_encrypt: function(key, bytes64)
{
	var bytes = b64tohex(bytes64);
	var result = key.encrypt(bytes);
	var result64 = hex2b64(result);
	
	return result64;
},

rsa_encrypt_serialized_key: function(keyS, bytes64)
{
	var key = new RSAKey();
	key.deserialize(keyS);
	
	return Support.rsa_encrypt(key, bytes64);
},

rsa_decrypt: function(key, bytes64)
{
	var bytes = b64tohex(bytes64);
	var result = key.decrypt(bytes);
	var result64 = hex2b64(result);
	return result64;
},

rsa_decrypt_serialized_key: function(keyS, bytes64)
{
	var key = new RSAKey();
	key.deserialize(keyS);
	
	return Support.rsa_decrypt(key, bytes64);
},

sha256_hash: function(bytes64)
{
	var bytes = sjcl.codec.base64.toBits(bytes64);
	var out = sjcl.hash.sha256.hash(bytes);
	var out64 = sjcl.codec.base64.fromBits(out);  
	return out64;
},

sha1_hash: function(bytes64)
{
	var bytes = CryptoJS.enc.Base64.parse(bytes64);
	var out = CryptoJS.SHA1(bytes);
	var out64 = out.toString(CryptoJS.enc.Base64);
	return out64;
},

sha1_hmac: function(key64, bytes64)
{
	var bytes = CryptoJS.enc.Base64.parse(bytes64);
	var key = CryptoJS.enc.Base64.parse(key64);
	var out = CryptoJS.HmacSHA1(bytes, key);
	var out64 = out.toString(CryptoJS.enc.Base64);
	return out64;
},

zip_inflate: function(data64)
{
	var data = Base64.decode(data64);
	var result = do_inflate(data);
	return Base64.encode(result);
},

zip_deflate: function(data64)
{
	var data = Base64.decode(data64);
	var result = do_deflate(data);
	var result64 = Base64.encode(result);
	
	if (Support.zip_inflate(result64) != data64)
	{
		var msg = "zip deflation failed, the world is fucked, again..";
		alert(msg);
		log(msg);
		throw new Error(msg);
	}
	
	return result64;
},

aes_generate: function()
{
	return Support.generate_random(256/8);
},

aes_encrypt: function(key64, iv64, block, encoder)
{
	encoder = encoder || Base64;
	var result = Support.aes_encrypt_CryptoJS(key64, iv64, encoder.encode(Utf.toBytes(block)));
	
	if (this.aes_decrypt(key64, iv64, result) !== block)
	{
		alert('aes bug, set breakpoint');
		throw "encryption failed";
	}
	
	return result;
},

aes_encrypt_CryptoJS: function(key64, iv64, bytes64)
{
	var key = CryptoJS.enc.Base64.parse(key64);
	var iv = CryptoJS.enc.Base64.parse(iv64);
	var bytes = CryptoJS.enc.Base64.parse(bytes64);
	
	var t = CryptoJS.AES.encrypt(bytes, key, { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7, iv:iv });
	var result = t.ciphertext.toString(CryptoJS.enc.Base64);
	
	return result;
},

aes_encrypt_SJCL: function(key64, iv64, bytes64)
{
	var bytes = sjcl.codec.base64.toBits(bytes64);
	var key = sjcl.codec.base64.toBits(key64);
	var iv = sjcl.codec.base64.toBits(iv64);

	var j = sjcl.encrypt(key, bytes,{ key:key, iv:iv, ks:256 });
	var result = JSON.parse(j).ct;

	return result;
},

aes_decrypt: function(key64, iv64, bytes64, decoder)
{
	decoder = decoder || Base64;
	return Utf.toString(decoder.decode(Support.aes_decrypt_CryptoJS(key64, iv64, bytes64)));
},

aes_decrypt_CryptoJS: function(key64, iv64, bytes64)
{
	var key = CryptoJS.enc.Base64.parse(key64);
	var iv = CryptoJS.enc.Base64.parse(iv64);
	var bytes = CryptoJS.enc.Base64.parse(bytes64);

	var cjs = CryptoJS.algo.AES.createDecryptor(key, { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7, iv:iv });
	var t = cjs.finalize(bytes);
	var result = t.toString(CryptoJS.enc.Base64);

	return result;
},

aes_decrypt_SJCL: function(key64, iv64, bytes64)
{
	var bytes = sjcl.codec.base64.toBits(bytes64);
	var key = sjcl.codec.base64.toBits(key64);
	var iv = sjcl.codec.base64.toBits(iv64);

	var j = sjcl.encrypt(key, bytes,{ key:key, iv:iv, ks:256 });
	var result = JSON.parse(j).ct;

	return result;
},

generate_random: function(numBytes)
{
	return Support.generate_random_SJCL(numBytes);
},

generate_random_SJCL: function(numBytes)
{
	var paranoia = 1; // not really sure what this means actually
	var bits = window.sjcl.random.randomWords(numBytes/4, paranoia);
	var bytes64 = window.sjcl.codec.base64.fromBits(bits);
	return bytes64;
},

aes_generate_iv: function()
{
	return Support.generate_random(8);
},

aes_encrypt_embedIV: function(key64, block)
{
	var iv64 = Support.aes_generate_iv();
	var encrypted = Support.aes_encrypt(key64, iv64, block);
	return JSON.stringify({ iv: iv64, block: encrypted, version:"beta3" });
},

aes_decrypt_embedIV: function(key64, block)
{
	var encrypted = JSON.parse(block);
	var version = encrypted.version || "beta1";

	var encoder = Base64;
	if (version == "beta1")
		encoder = Base64Dead;
	if (version == "beta2")
		encoder = {
			decode: function(x) {
				var y = Base64.decode(x);
				var x = [];
				for (var i=0; i<y.length; ++i)
				{
					if (y[i]!=0)
						x.push(y[i]);
				}
				
				return x;
			}
		}
	
	return Support.aes_decrypt(key64, encrypted.iv, encrypted.block, encoder);
},

aes_encrypt_multi: function (key64, blocks)
{
	var results = [];
	for (var i=0; i<blocks.length; ++i)
	{
		var block = blocks[i];
		
		//@TODO should I test undefined?
		if (block)
			results.push(Support.aes_encrypt_embedIV(key64, block));
		else
			results.push(block);
	}
	
	return results;
},

aes_decrypt_multi: function (key64, blocks)
{
	var results = [];
	for (var i=0; i<blocks.length; ++i)
	{
		var block = blocks[i];
		
		//@TODO should I test undefined?
		if (block)
			results.push(Support.aes_decrypt_embedIV(key64, block));
		else
			results.push(block);
	}
	
	return results;
},

pbe_genKey: function(password, salt64, iterationCount, keyLength)
{
	return Support.pbe_genKey_SJCL(password, salt64, iterationCount, keyLength);
},

pbe_genKey_CryptoJS: function(password, salt64, iterationCount, keyLength)
{
	return CryptoJS.PBKDF2(password, salt64, { keySize: keyLength/32, iterations: iterationCount});
},

pbe_genKey_SJCL: function(password, salt64, iterationCount, keyLength)
{
	var salt = sjcl.codec.base64.toBits(salt64);
	p = sjcl.misc.pbkdf2(password, salt, iterationCount, keyLength);
	return sjcl.codec.base64.fromBits(p);

//	var p = { salt: salt, iter:iterationCount };
//	p = sjcl.misc.pbkdf2(password, p);
//	return sjcl.codec.base64.fromBits(p.key);
},

srp_client_initialize: function(password64)
{
	return new SRPClient({}).setPassword(password64).serialize();
},

srp_client_setSalt: function(state, salt64)
{
	return new SRPClient(state).setSalt(salt64).serialize();
},

srp_client_setServerPublicKey: function(state, publicKey64)
{
	return new SRPClient(state).setServerPublicKey(publicKey64).serialize();
},

srp_client_validateServerEvidence: function(state, evidence64)
{
	return new SRPClient(state).validateServerEvidence(evidence64).serialize();
},

srp_client_getSessionKey: function(state)
{
	return new SRPClient(state).getSessionKey();
},

srp_client_getPublicKey: function(state)
{
	return new SRPClient(state).getPublicKey();
},

srp_client_getEvidenceValue: function(state)
{
	return new SRPClient(state).getEvidenceValue();
},

ping: function()
{
	return 'ping';
}

};


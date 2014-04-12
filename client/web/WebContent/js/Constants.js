define([
	'base64',
], function ($,_,openpgp) {

	DEBUG = (window.location.hostname == 'localhost');
	var DEV_BASE = "http://pmx.mooo.com:8080";
	var BASE = DEBUG ? DEV_BASE : '';

	var DEV_HOSTNAME = "pmx.mooo.com";
	var HOSTNAME = DEBUG ? DEV_HOSTNAME : window.location.hostname;
	
	Constants = {
		ATHOST: '@' + HOSTNAME,
	
		URL: BASE + '/mv/',
		REST: BASE + '/mv/rest/',
		
		PBE_PARAMS : {
			beta3: {
				version: "beta3",
				verificationSalt64: 'sEKAD85s2KM=',
				encryptionSalt64: 'AWZ82m0AIXc=',
				iterationCount: 32764,
				keyLength: 256,
			},
			beta1: {
				version: "beta1",
				verificationSalt64: 'ODc2NTQzMjEK',
				encryptionSalt64: 'MTIzNDU2NzgK',
				iterationCount: 32764,
				keyLength: 256,
			},
		},
		
		PBE_PARAMS_LATEST : "beta3",
		
		
		PGP_SERVERS : [
		   BASE + '/mv/util/PGPProxy'        
		],
		
		VERSION: "1",
	};
	
});
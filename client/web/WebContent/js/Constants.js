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
		
		ENCRYPTION_SALT64: 'MTIzNDU2NzgK',
		VERIFICATION_SALT64: 'ODc2NTQzMjEK',
		
		PGP_SERVERS : [
		   BASE + '/mv/util/PGPProxy'        
		],
		
		VERSION: "1",
	};
	
});
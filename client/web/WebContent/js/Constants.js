define([
	'base64',
], function ($,_,openpgp) {

	var BASE = (window.location.hostname == 'localhost') ? 'http://localhost:8080' : '';
	//BASE = "http://pmx.mooo.com:8080";

	var HOSTNAME = window.location.hostname;
	//HOSTNAME = "pmx.mooo.com";
	
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
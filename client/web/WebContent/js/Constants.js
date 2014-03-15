define([
	'base64',
], function ($,_,openpgp) {

	var BASE = (window.location.hostname == 'localhost') ? 'http://localhost:8080' : '';
	
	Constants = {
		ATHOST: '@' + window.location.hostname,
		
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
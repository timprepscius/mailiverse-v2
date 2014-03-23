define([
	'jquery',
	'underscore',
	'backbone',
	'dispatch',
], function ($,_,Backbone) {
	
	
	var ajax_save = Backbone.ajax;
	Backbone.ajax = function(params, options) {
		params = params || {};
		params.headers = params.headers || {};
		params.headers["X-Session"] = appSingleton.login.get('session');
		
		return ajax_save(params,options);
	} ;
});
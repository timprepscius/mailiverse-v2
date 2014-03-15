define([
	'jquery',
	'underscore',
	'backbone',
	'ckeditor',
	'ckeditor_adapter',
	'dispatch',
], function ($,_,Backbone) {

	CKEDITOR.disableAutoInline = true;
	CKEDITOR.resize_enabled = true;
	CKEDITOR.startupFocus = false;
	
	Dispatch.startWorker();
	
	main = function()
	{
		appSingleton = new AppView({ el: '#mailiverse-application' });
		appSingleton.render();
		
		appSingleton.gotoLogin();
	}
});
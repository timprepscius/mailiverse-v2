define([
	'jquery',
	'underscore',
	'backbone',
	'ckeditor',
	'ckeditor_adapter',
	'dispatch',
], function ($,_,Backbone) {

	CKEDITOR.config.disableAutoInline = true;
	CKEDITOR.config.resize_enabled = true;
	CKEDITOR.config.startupFocus = false;
	CKEDITOR.config.enterMode = CKEDITOR.ENTER_BR;
	
	Dispatch.startWorker();
	
	main = function()
	{
		appSingleton = new AppView({ el: '#mailiverse-application' });
		appSingleton.render();
		
		appSingleton.gotoLogin();
	};
});
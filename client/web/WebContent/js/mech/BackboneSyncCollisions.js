define([
	'jquery',
	'underscore',
	'backbone',
	'dispatch',
], function ($,_,Backbone) {
	
	var sync_save = Backbone.sync;
	Backbone.sync = function(method, model, options) {
		var syncTime = new Date();
		var options_success = options.success;

		options.success = function () {
			var methodWrite = (method === 'create' || method === 'update' || method === 'patch');
			if (!methodWrite && model.lastModificationTime && syncTime.getTime() < model.lastModificationTime)
			{
				console.log("modification was made after sync, disregarding");
				console.log("reissuing fetch");
				model.fetch();
			}
			else
			{
				options_success.apply(this, arguments);
			}				
		};
		
		return sync_save.apply(this, [method, model, options]);
	};
	
	//---------------------------------------------------------------------
	//---------------------------------------------------------------------
	//---------------------------------------------------------------------
	
	Backbone.Collection.prototype.updateModificationTime = function ()
	{
		this.lastModificationTime = new Date();
	};
	
	var add_save = Backbone.Collection.prototype.add;
	Backbone.Collection.prototype.add = function ()
	{
		this.updateModificationTime();
		return add_save.apply(this,arguments);
	};
	
	var remove_save = Backbone.Collection.prototype.remove;
	Backbone.Collection.prototype.remove = function ()
	{
		this.updateModificationTime();
		return remove_save.apply(this,arguments);
	};
	
	Backbone.Model.prototype.updateModificationTime = function ()
	{
		this.lastModificationTime = new Date();
	};
	
});
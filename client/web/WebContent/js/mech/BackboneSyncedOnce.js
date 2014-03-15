define([
	'jquery',
	'underscore',
	'backbone',
	'dispatch',
], function ($,_,Backbone) {
	
	var sync_save = Backbone.sync;
	Backbone.sync = function(method, model, options) {
		var that = this;
		this.synced = this.synced || false;
		
		var options_success = options.success;
		options.success = function () {
			that.synced = true;
			options_success.apply(this, arguments);
		};
		
		return sync_save.apply(this, [method, model, options]);
	};

	//---------------------------------------------------------------------
	//---------------------------------------------------------------------
	//---------------------------------------------------------------------
	
	Backbone.Collection.prototype.onCreate = function ()
	{
		this.synced = true;
		this.trigger('sync');
	};

	Backbone.Collection.prototype.isSyncedOnce = function () {
		return this.synced;
	};
	
	Backbone.Collection.prototype.syncedOnce = function(fn) {
		var that = this;
		if (this.isSyncedOnce())
			setTimeout(function() { fn(that); }, 1);
		else
			this.once('sync', function() { fn(that); });
	};
	
	Backbone.Model.prototype.onCreate = function ()
	{
		this.synced = true;
		this.trigger('sync');
	};
	
	Backbone.Model.prototype.isSyncedOnce = function () {
		return this.synced || this.get('syncVersion');
	};
	
	Backbone.Model.prototype.fetchOrCreate = function () {
		var that = this;
		return this.fetch({
			error: function () {
				that.onCreate();
			}
		});
	};

	Backbone.Model.prototype.syncedOnce = function(fn) {
		var that = this;
		if (this.isSyncedOnce())
			setTimeout(function() { fn(that); }, 1);
		else
			this.once('sync', function() { fn(that); });
	};
});
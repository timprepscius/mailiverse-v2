define([
	'jquery',
	'underscore',
	'backbone',
	'dispatch',
], function ($,_,Backbone) {

	Backbone.itemsToSave = [];
	Backbone.itemsToDelete = [];
	
	Backbone.atomicEvents = new Backbone.Model();

	//------------------

	Backbone.Collection.prototype.atomic_save = Backbone.Collection.prototype.save;
	Backbone.Collection.prototype.save = function()
	{
		Backbone.itemsToSave.push(this);
		this.updateModificationTime();
		
		Backbone.atomicEvents.trigger("needsSync");
	};
	
	Backbone.Collection.prototype.atomic_destroy = Backbone.Collection.prototype.destroy;
	Backbone.Collection.prototype.destroy = function()
	{
		Backbone.itemsToDelete.push(this);
		this.updateModificationTime();
		
		Backbone.atomicEvents.trigger("needsSync");
	},
	
	//------------------
	
	Backbone.Model.prototype.atomic_save = Backbone.Model.prototype.save;
	Backbone.Model.prototype.save = function()
	{
		Backbone.itemsToSave.push(this);
		this.updateModificationTime();
		
		Backbone.atomicEvents.trigger("needsSync");
	},

	Backbone.Model.prototype.atomic_destroy = Backbone.Model.prototype.destroy;
	Backbone.Model.prototype.destroy = function()
	{
		Backbone.itemsToDelete.push(this);
		this.updateModificationTime();
		
		Backbone.atomicEvents.trigger("needsSync");
	},

	//------------------

	Backbone.atomicIONeeded = function() {
		return (Backbone.itemsToSave.length + Backbone.itemsToDelete.length) > 0;
	},
	
	Backbone.atomicIO = function(callbacks) {
		var objectsToSave = _.uniq(Backbone.itemsToSave);
		var objectsToDelete = _.uniq(Backbone.itemsToDelete);
		Backbone.itemsToSave = [];
		Backbone.itemsToDelete = [];
		
		Backbone.atomicIOImplementation (objectsToSave, objectsToDelete, {
			success: function () {
				callbacks.success();
				
				if (Backbone.atomicIONeeded())
					Backbone.atomicEvents.trigger("needsSync");
			},
					
			failure: function () {
				_.each(objectsToSave, function(object) {
					Backbone.itemsToSave.push(object);
				});
				_.each(objectsToDelete, function(object) {
					Backbone.itemsToDelete.push(object);
				});
				
				Backbone.atomicEvents.trigger("syncFailed");
				
				if (callbacks.failure)
					callbacks.failure();
			}
		});
	},
	
	// @TODO hook up to actual atomic save api
	// @TODO make atomic save somehow work with mongo
	Backbone.atomicIOImplementation = function(objectsToSave, objectsToDelete, callbacks) {
		
		var oneFailed = false;
		
		var onDone = _.after(objectsToDelete.length +1 , function() {
			if (oneFailed)
			{
				if (callbacks.failure)
					callbacks.failure();
			}
			else
			{
				if (callbacks.success)
					callbacks.success();
			}
		});
		
		var afterSave = _.after(objectsToSave.length + 1, function() {
			
			_.each(objectsToDelete, function(object) {
				object.atomic_destroy({
					success: function () {
						onDone();
					},
					error: function() {
						oneFailed = true;
						onDone();
					}
				});
			});
			
			onDone();
		});
		
		_.each(objectsToSave, function(object) {
			object.atomic_save(null,{
				success: function () {
					afterSave();
				},
				error: function() {
					oneFailed = true;
					afterSave();
				}
			});
		});
		
		afterSave();
	};
	
});
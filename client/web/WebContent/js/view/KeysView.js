define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/profileTemplate.html',

	'modelBinder',
], function ($,_,Backbone,template) {
	
	KeysView =  Backbone.View.extend({
		
        events: {
            'click .done' : 'onDone',
            'click #save-changes' : 'onSaveChanges',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.appView = options.appView;
        	_.bindAll(this, 'onDone', 'onSaveChanges');
        },
          
        onDone: function()
        {
        	
        },
        
        onSaveChanges: function()
        {
        	appSingleton.user.set('name', this.$('#name').val());
        	appSingleton.user.save();
        	appSingleton.user.trigger('change');
        },
        
        render: function( model ) {
        	var rendered = _.template(template, { model: this.model });
            this.$el.html(rendered);
            
            this.$('#profile-modal').modal({ show: true });    
            return this;
        },
        
	});
	
});
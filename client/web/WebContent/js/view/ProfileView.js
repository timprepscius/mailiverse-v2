define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/profileTemplate.html',

	'modelBinder',
], function ($,_,Backbone,template) {
	
	ProfileView =  Backbone.View.extend({
		
        events: {
            'click .done' : 'onDone',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.appView = options.appView;
        	_.bindAll(this, 'onDone');
        	
        	this.$el.modal();
        },
          
        onDone: function()
        {
        },
        
        render: function( model ) {
        	var rendered = _.template(template, { model: this.model });
            $(this.el).html(rendered);
            return this;
        },
        
	});
	
});
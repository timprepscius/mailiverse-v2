define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/originalTemplate.html',

	'modelBinder',
], function ($,_,Backbone,originalTemplate) {
	
	OriginalView = Backbone.View.extend({
		
        events: {
            'click .done' : 'onDone'
        },
        
        initialize: function(options) 
        {
        	var that = this;
        	this.modelBinders = [];
        	this.appView = options.appView;
        	_.bindAll(this, 'onDone');
        	this.keysListView = null;
        	
        	this.model.fetch({
        		success: function() {
        			that.model.decryptWithoutProcessing({
        				success: function(content) {
        					that.content = content;
        					that.onContent();
        				},
        				failure: function(message) {
        					that.content = JSON.stringify(message);
        					that.onContent();
        				},
        			});
        		},
        		error: function(message) {
        			that.content = JSON.stringify(message);
        			that.onContent();
        		},
        	});
        },
          
        onDone: function()
        {
        	
        },
        
        onContent: function() {
        	// @TODO is this safe
        	this.$('.original-content').text(this.content);
        },
        
        render: function( ) {
        	var rendered = _.template(originalTemplate, { model: this.model });
            this.$el.html(rendered);
            
            this.$('#original-modal').modal({ show: true });    
            return this;
        },
        
	});
	
});
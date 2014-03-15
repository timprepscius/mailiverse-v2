define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/syncTemplate.html',

	'modelBinder',
], function ($,_,Backbone,template) {
	
	SyncView =  Backbone.View.extend({
		
        events: {
            'click .sync' : 'onSync',
        },
        
        state : 'saved',
        
        initialize: function(options) 
        {
        	_.bindAll(this, 'onSync');
        },
        
        onSync: function(event)
        {
        	var that = this;
        	if (that.state == 'saving')
        		return;
        	
        	that.state = 'saving';
			that.render();

			Backbone.atomicIO({
        		success: function() {
        			that.state = 'saved';
        			that.render();
        		},
        		failure: function() {
        			that.state = 'failure';
        			that.render();
        		}
        	});
        },
                
        render: function( model ) {
        	var rendered = _.template(template, { state: this.state });
            $(this.el).html(rendered);
            return this;
        },
        
	});
	
});
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
        	var that = this;
        	_.bindAll(this, 'onSync');
    		Backbone.atomicEvents.on("needsSync", function() {
    			Util.keyTimeout ("SyncView-needsSync", 500, that.onSync);
    		});
    		
    		Backbone.atomicEvents.on("syncFailed", function() {
    			Util.keyTimeout ("SyncView-needsSync", 2 * 1000, that.onSync);
    		});
    		
    		if (Backbone.atomicIONeeded())
    			Util.keyTimeout ("SyncView-needsSync", 1000, that.onSync);
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
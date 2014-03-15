define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/downloadMailTemplate.html',

	'modelBinder',
], function ($,_,Backbone,template) {
	
	DownloadMailView =  Backbone.View.extend({
		
        events: {
            'click .download' : 'onProcess',
        },
        
        state : 'finished',
        
        initialize: function(options) 
        {
        	_.bindAll(this, 'onProcess');
        	this.mailReceiver = new MailReceiver();
        },
        
        onProcess: function(event)
        {
        	var that = this;
        	if (that.state == 'getting')
        		return;
        	
        	that.state = 'getting';
			that.render();

			this.mailReceiver.start({
        		success: function() {
        			that.state = 'finished';
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
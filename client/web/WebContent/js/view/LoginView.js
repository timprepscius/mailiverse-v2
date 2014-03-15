define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/loginTemplate.html',

	'modelBinder',
], function ($,_,Backbone,template) {
	
	LoginView =  Backbone.View.extend({
		
        events: {
            'click .submit' : 'onSubmit',
            'click .signup' : 'onSignup',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.appView = options.appView;
        },
        
        onSubmit: function(event)
        {
        	var that = this;
        	event.preventDefault();
        	this.onStart();
        	
        	var name = this.$('.name').val();
        	var password = this.$('.password').val();
        	this.clear();
        	
        	LoginProcessor.process(name, password, {
        		step: function (step) {
        			that.onStep (step);
        		},
        		success: function (user) {
        			that.onSuccess(user);
        		},
        		failure: function (reason) {
        			that.onFailure(reason);
        		}
        	});
        },
        
        clear: function ()
        {
        	this.$('.name').val('');
        	this.$('.password').val('');
        },
        
        onSignup: function (event)
        {
        	event.preventDefault();
        	this.appView.gotoSignup();
        },
        
        onStart: function()
        {
        	this.$('.form').hide();
        	this.$('.activity').show();
        },
        
        onEnd: function()
        {
        	this.$('.activity').hide();
        	this.$('.form').show();
        },
        
        onStep: function(step)
        {
        	this.$('.activity-step').text(step);
        },
        
        onSuccess: function(user)
        {
        	this.onEnd();
        	this.appView.onLogin(user);
        },
        
        onFailure: function(error)
        {
        	this.onEnd();
        },
        
        render: function( model ) {
        	var that = this;
        	
        	var rendered = _.template(template, { model: this.model });
            $(this.el).html(rendered);
            return this;
        },
        
	});
	
});
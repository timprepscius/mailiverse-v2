define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/signupTemplate.html',

	'modelBinder',
], function ($,_,Backbone,template) {
	
	SignupView =  Backbone.View.extend({
		
        events: {
            'click .submit' : 'onSubmit',
            'click .login' : 'onLogin',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.appView = options.appView;
        	_.bindAll(this, 'onCryptoSeeded', 'onStep', 'onSuccess', 'onFailure');
        	
        	Crypto.seedRandom ( { success: this.onCryptoSeeded, failure: this.onPGPFailure });
        },
        
        onCryptoSeeded: function()
        {
        	this.onStep('Crypto seeded');
        },
        
        onSubmit: function(event)
        {
        	event.preventDefault();
        	this.onStart();
        	
        	var name = this.$('.name').val();
        	var password = this.$('.password').val();
        	this.clear();
        	
        	SignupProcessor.process(name, password, {
        		step: this.onStep,
        		success: this.onSuccess,
        		failure: this.onFailure
        	});
        },
        
        clear: function ()
        {
        	this.$('.name').val('');
        	this.$('.password').val('');
        },
        
        onLogin: function (event)
        {
        	event.preventDefault();
        	this.appView.gotoLogin();
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
        	this.appView.onError(error.responseText);
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
        	this.appView.onError(error.responseText);
        	this.onEnd();
        },
        
        render: function( model ) {
        	var rendered = _.template(template, { model: this.model });
            $(this.el).html(rendered);
            return this;
        },
        
	});
	
});
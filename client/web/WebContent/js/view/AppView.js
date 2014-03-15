define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/appTemplate.html',

	'modelBinder',
], function ($,_,Backbone,appTemplate) {

	AppView = Backbone.View.extend({
		
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.user = null;
        	this.login = null;
        	this.mainView = null;
        	this.mailSender = new MailSender();
        },
        
        render: function( model ) {
        	var rendered = _.template(appTemplate, { model: this.model });
            this.$el.html(rendered);
            
        	this.loginView = new LoginView ({ el: this.$('#login'), appView:this});
        	this.loginView.render();
            
        	this.signupView = new SignupView ({ el: this.$('#signup'), appView:this});
        	this.signupView.render();

        	return this;
        },
        
        gotoLogin: function () {
        	this.loginView.clear();
        	this.$('#login').show();
        	this.$('#signup').hide();
        },
        
        gotoSignup: function () {
        	this.signupView.clear();
        	this.$('#signup').show();
        	this.$('#login').hide();
        },
        
        onLogin: function (user) {
        	this.loginView.clear();
        	this.signupView.clear();
        	
        	this.user = user;
    		this.user.checkForUpdates();

        	this.mainView = new MainView({user:user});
        	this.$('#main').html(this.mainView.render().el);
        	this.$('#main').show();
        	this.$('#login').hide();
        	this.$('#signup').hide();
        },
        
        sendMail: function (mail) {
        	this.mailSender.send(mail);
        }
	});
});
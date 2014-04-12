define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/appTemplate.html',
	'text!templates/errorTemplate.html',

	'modelBinder',
], function ($,_,Backbone,appTemplate, errorTemplate) {

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

        	this.updateLoginView = new UpdateLoginView ({ el: this.$('#updateLogin'), appView:this});
        	this.updateLoginView.render();

        	return this;
        },
        
        gotoLogin: function () {
        	this.loginView.clear();
        	this.loginView.$el.show();
        	this.signupView.$el.hide();
        	this.updateLoginView.$el.hide();
        },
        
        gotoSignup: function () {
        	this.signupView.clear();
        	this.signupView.$el.show();
        	this.loginView.$el.hide();
        },
        
        gotoUpdate: function () {
        	this.updateLoginView.clear();
        	this.updateLoginView.$el.show();
        	this.loginView.$el.hide();
        },

        onLogin: function (user) {
        	this.loginView.clear();
        	this.signupView.clear();
        	this.updateLoginView.clear();
        	
        	this.user = user;
    		this.user.checkForUpdates();

        	this.mainView = new MainView({user:user});
        	this.$('#main').html(this.mainView.render().el);
        	this.$('#main').show();
        	this.loginView.$el.hide();
        	this.signupView.$el.hide();
        	this.updateLoginView.$el.hide();
        },
        
        onError: function (error) {
        	this.$('#error').html(_.template(errorTemplate, { error: error }));
        	this.$('#error-modal').modal({ show: true });
        },
        
        sendMail: function (mail) {
        	this.mailSender.send(mail);
        }
	});
});
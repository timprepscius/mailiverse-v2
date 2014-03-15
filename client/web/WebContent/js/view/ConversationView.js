define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/conversationTemplate.html',

	'modelBinder',
], function ($,_,Backbone,conversationTemplate) {
	
	ConversationView = Backbone.View.extend({
		
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.mailListView = null;
        	_.bindAll(this, 'render');
        },
        
        render: function() {
        	var rendered = _.template(conversationTemplate, { model: this.model });
            this.$el.html(rendered);

            var mb = new Backbone.ModelBinder();
            this.modelBinders.push(mb);
            mb.bind(this.model, this.el);
            
            this.mailListView = new MailListView({el:this.$('#main-mail-list'), collection:this.model.getMails()});
            this.mailListView.render();
            
            return this;
        },
        
	});
	
});
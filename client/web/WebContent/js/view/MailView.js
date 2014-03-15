define([
        'jquery',
        'underscore',
        'backbone',
        'text!templates/mailPartialTemplate.html',
        'text!templates/mailFullTemplate.html',
        'text!templates/mailViewTemplate.html',

        'modelBinder',
        'ckeditor',
        'ckeditor_adapter',
        ], function ($,_,Backbone,mailPartialViewTemplate, mailFullViewTemplate, mailViewTemplate) {

	MailPartialView = Backbone.View.extend({

		initialize: function(options) 
		{
			this.modelBinders = [];
			_.bindAll(this, 'render');
		},

		render: function() {
			var rendered = _.template(mailPartialViewTemplate, { model: this.model });
			this.$el.html(rendered);

			return this;
		},
	});

	MailFullView = Backbone.View.extend({

		initialize: function(options) 
		{
			this.modelBinders = [];
			_.bindAll(this, 'render');
		},

		render: function() {
			var rendered = _.template(mailFullViewTemplate, { model: this.model });
			this.$el.html(rendered);

			return this;
		},

	});

	MailView = Backbone.View.extend({

		events: {
			'click .conversation-mail-header .clickable' : 'onModeChange',
			'click .send' : 'onSend',
		},

		initialize: function(options) 
		{
			this.mode = 'none';
			this.partialView = null;
			this.fullView = null;
			_.bindAll(this, 'render', 'onModeChange', 'onSend');
			
			this.model.on('changed', this.render);
		},

		showMode: function()
		{
			if (this.mode == 'partial')
				this.partialView.$el.show();
			if (this.mode == 'full')
				this.fullView.$el.show();
		},
		
		hideMode : function()
		{
			if (this.mode == 'partial')
				this.partialView.$el.hide();
			if (this.mode == 'full')
				this.fullView.$el.hide();
		},
		
		setMode: function(mode)
		{
			if (this.mode != mode)
			{
				this.hideMode();
				this.mode = mode;
				this.showMode();
			}
		},
		
		onModeChange: function(event)
		{
			this.hideMode();

			if (this.mode == 'partial')
				this.mode = 'full';
			else
				this.mode = 'partial';
			
			this.showMode();
		},

		render: function() {
			var rendered = _.template(mailViewTemplate, { model: this.model });
			this.$el.html(rendered);
			
			this.partialView = new MailPartialView({ el: this.$('.mail-partial-view'), model: this.model});
			this.partialView.render();
			
			this.fullView = new MailFullView({ el: this.$('.mail-full-view'), model: this.model});
			this.fullView.render();
			
			return this;
		},
		
		showEditor: function ()
		{
			this.$('.reply-body').ckeditor();
			this.$('.conversation-mail-reply').show();
		},

		onSend: function ()
		{
			var val = this.$('.reply-body').ckeditor().val();
			
		},
	});

});
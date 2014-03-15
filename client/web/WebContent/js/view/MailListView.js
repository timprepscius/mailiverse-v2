define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/mailListTemplate.html',

	'modelBinder',
], function ($,_,Backbone,mailListTemplate) {
	
	MailListView = Backbone.View.extend({

    	events: {
    		'click .click-to-reply' : 'onReply'
    	},
    	
        initialize: function(options) 
        {
            var that = this;
            _.bindAll(this, 'render');
            
            this.lastView = null;

            this.collection.bind("add", function( model ){
        		Util.keyTimeout("MailListView-collection-all", 100, that.render);
            });
            
            this.collection.bind("remove", function( model ){
        		Util.keyTimeout("MailListView-collection-all", 100, that.render);
            });

            this.views = {};
        	_.bindAll(this, 'render', 'onReply');
        },
        
                
        render: function() 
        {
        	this.$el.html(_.template(mailListTemplate));
        	if (this.collection.isSyncedOnce())
        		this.$("#main-mail-list-items").empty();
        	
        	var lastView = null;
        	var lastModel = null;
        	var lastViewNonDraft = null;
        	
        	_.each(
        		this.collection.models,
        		
        		function(model) 
        		{
        			if (!_.has(this.views, model.cid))
        			{
        				var view = null;
        				
        				if (model.get('draft'))
        				{
			                view = new ComposeView({ tagName: 'tr', model: model, replyTo: lastModel });
			                view.render();
        				}
        				else
        				{
			                view = new MailView({ tagName: 'tr', model: model });
			                view.render();
			                view.setMode('partial');
			                lastViewNonDraft = view;
        				}

		                this.views[model.cid] = view;
        			}
        			
        			var view = this.views[model.cid];
        			lastView = view;
        			lastModel = view.model;
        			view.delegateEvents();
	                this.$("#main-mail-list-items").append(view.el);
            	}, 
            	
            	this
            );
        	
        	this.lastView = lastView;
        	
        	var lastViewIsDraft = lastView && lastView.model.get('draft');
        	if (!lastViewIsDraft)
        		 this.$(".click-to-reply").show();
        	else
        		this.$(".click-to-reply").hide();
        	
        	if (lastViewNonDraft)
        		lastViewNonDraft.setMode('full');
        		
        	
        	return this;
        },
        
        onReply: function() 
        {
        	var conversation = this.collection.conversation;
    		var mail = conversation.newMail();
    		var inReplyTo = this.lastView.model;
    		mail.set('from', 'me');
    		mail.set('subject', 'Re: ' + conversation.get('subject'));
    		mail.set('to', inReplyTo.getReplyTo());
    		        		
    		conversation.recomputeAttributesAndFolderMemberships();
    		conversation.save();
    		mail.save();
        }
    });  
});
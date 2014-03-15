define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/mainTemplate.html',
	'text!templates/sidebarTemplate.html',

	'modelBinder',
], function ($,_,Backbone,mainTemplate) {
	
	MainView = Backbone.View.extend({
		
        events: {
        },
        
        currentView: null,
        
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.user = options.user;
        	
        	this.sidebar = new SidebarView({mainView:this});
        	this.sidebar.render();
        	
        	this.syncView = new SyncView({mainView:this});
        	this.syncView.render();

        	this.downloadMailView = new DownloadMailView({mainView:this});
        	this.downloadMailView.render();
        },
        
        render: function( model ) {
        	var rendered = _.template(mainTemplate, { model: this.model, user: this.user });
            this.$el.html(rendered);
            
            this.$('#main-sidebar').html(this.sidebar.el);
            this.$('#main-sync').html(this.syncView.el);
            this.$('#main-download-mail').html(this.downloadMailView.el);
            return this;
        },
        
        loadFolder: function (folder) {
        	this.closeCurrentView();
        	var conversationListView = new ConversationListView({el:this.$('#main-conversation-list'), collection:folder.getConversations()});
        	conversationListView.render();
        	this.showCurrentView(conversationListView);
        	
        	return this;
        },
        
        loadConversation: function (conversation) 
        {
        	this.closeCurrentView();
        	var conversationView = new ConversationView ({el:this.$('#main-conversation'), model:conversation});
        	conversationView.render();
        	this.showCurrentView(conversationView);
        	
        	return this;
        },
        
        loadCompose: function () 
        {
    		var conversation = new Conversation({syncId:Util.guid()});
    		conversation.onCreate();
    		
    		var mail = conversation.newMail();
    		        		
    		conversation.recomputeAttributesAndFolderMemberships();
    		conversation.save();
    		mail.save();
    		
    		this.user.getConversations().add(conversation);
    		this.loadConversation(conversation);
        },
        
        closeCurrentView: function() {
        	if (this.currentView)
        	{
        		this.currentView.$el.hide();
        		// can't remove, what should I do?
        		this.currentView = null;
        	}
        },
        
        showCurrentView: function (view) {
        	this.currentView = view;
        	view.$el.show();
        }
	});
});
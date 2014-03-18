define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/mainTemplate.html',

	'modelBinder',
], function ($,_,Backbone,mainTemplate) {
	
	MainView = Backbone.View.extend({
		
        events: {
        	'click #main-compose-button': 'loadCompose',
        	'click #main-profile': 'showProfile',
        },
        
        currentView: null,
        
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.user = options.user;
        	
        	this.syncView = new SyncView({mainView:this});
        	this.syncView.render();

        	this.downloadMailView = new DownloadMailView({mainView:this});
        	this.downloadMailView.render();

        	this.folderListView = new FolderListView({ collection:this.user.getFolders() });
        	this.folderListView.render();
        	
        	_.bindAll(this, 'loadCompose', 'showProfile');
        },
        
        render: function( model ) {
        	var rendered = _.template(mainTemplate, { model: this.model, user: this.user });
            this.$el.html(rendered);
            
            this.$('#main-sync').html(this.syncView.el);
            this.$('#main-download-mail').html(this.downloadMailView.el);
            this.$('#main-folders-container').html(this.folderListView.el);
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
        
        showProfile: function()
        {
        	var profile = new ProfileView({ el: this.$('#main-modal'), model:this.user});
        	profile.render();
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
        },
	});
});
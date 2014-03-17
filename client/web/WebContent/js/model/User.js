define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	UserExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
    User = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'User',
    	folders: null,
    	conversations: null,
    	contacts: null,
    	originals: null,
    	keyring: null,
    	exposedFields: UserExposedFields,
    	
    	getConversations: function()
    	{
        	if (!this.conversations) {
        		this.conversations = new Conversations([], { user:this });
        		this.conversations.fetch();
        	}
        	return this.conversations;
    		
    	},
    	
        getFolders: function() 
        {
        	if (!this.folders) {
        		this.folders = new Folders([], { user:this});
        		this.folders.fetch();
        	}
        	return this.folders;
        },
        
        getContacts: function()
        {
        	if (!this.contacts) {
        		this.contacts = new Contacts([], { user:this});
        		this.contacts.fetch();
        	}
        	return this.contacts;
        },
        
        getKeyRing: function()
        {
        	if (!this.keyring) {
        		this.keyring = new Keys([], { user: this });
        	};
        	return this.keyring;
        },
        
        getOriginals: function()
        {
        	if (!this.originals) {
        		this.originals = new Originals();
        	}
        	
        	return this.originals;
    	},
        
        getNewMail: function()
        {
        	var originals = new Originals([], { after: null });
//        	var originals = new Originals([], { after: this.get('lastMailProcessed')});
        	originals.fetch();
        	
        	return originals;
    	},
    	
    	// @TODO move this somewhere else
        checkForUpdates: function()
        {
        	// if this is a first runs
        	var updates = this.get('updates') || [];

        	if (!_.contains(updates, 'createdFolders'))
        	{
        		this.getFolders().create({ 
        			name: 'Inbox', 
        			ordering: 0, 
        			inclusion_criteria : { received: true }, 
        			exclusion_criteria : { spam: true, trash: true },
        			syncId: Util.guid()
        		});
        		this.getFolders().create({ 
        			name: 'Sent', ordering: 1, 
        			inclusion_criteria : { sending: true, sent: true }, 
        			exclusion_criteria : { trash: true },
        			syncId: Util.guid()
        		});
        		this.getFolders().create({ 
        			name: 'Drafts', 
        			ordering: 2, 
        			inclusion_criteria : { draft: true }, 
        			exclusion_criteria : { trash: true },
        			syncId: Util.guid()
        		});
        		this.getFolders().create({ 
        			name: 'All', 
        			ordering: 3, 
        			inclusion_criteria : { all: true }, 
        			exclusion_criteria : { spam: true, trash: true },
        			syncId: Util.guid()
        		});
        		this.getFolders().create({ 
        			name: 'Spam', 
        			ordering: 4, 
        			inclusion_criteria : { spam: true }, 
        			exclusion_criteria : { trash: true },
        			syncId: Util.guid()
        		});
        		this.getFolders().create({ 
        			name: 'Trash', 
        			ordering: 5, 
        			inclusion_criteria : { trash: true }, 
        			syncId: Util.guid()
        		});
        		
        		updates.push('createdFolders');
        		this.set('updates', updates);
        		this.save();
        	}
        },
        
        setLastMailProcessed: function(id)
        {
        	this.set("lastMailProcessed", id);
        },
        
        getNickName: function ()
        {
        	return this.get('name') && appSingleton.login.get('address');
        },
    });

});
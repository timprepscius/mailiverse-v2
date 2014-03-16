define([
	'jquery',
	'underscore',
	'backbone',
	
	'pageable',
	
], function ($,_,Backbone) {
	
	ConversationReferenceExposedFields = [ 'syncId', 'syncOwner', 'syncVersion', 'conversation', 'folder', 'date' ];

    ConversationReference = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'ConversationReference',
    	conversation: null,
    	exposedFields: ConversationReferenceExposedFields,
    	
    	// @TODO this should probably be refactored, not sure how to do it yet.
    	getConversation: function() {
        	if (!this.conversation) {
        		this.conversation = appSingleton.user.getConversations().get(this.get('conversation'));
        		
        		if (!this.conversation)
        		{
	        		this.conversation = new Conversation({ syncId:this.get('conversation') });
	        		this.conversation.fetch();
	        		appSingleton.user.getConversations().add(this.conversation);
        		}
        	}
        	return this.conversation;
        },
        
    });

    ConversationReferences = Backbone.Collection.extend({
    	url: function () { 
    		var r = 
    			Constants.REST + 'ConversationReferences' +
    				'?field=' + this.field + 
    				"&id=" + this.id + 
    				"&orderBy=date&orderDirection=-1" +
    				(this.page!==undefined ?
    						("&offset=" + (this.page * this.pageSize) + "&limit=" + this.pageSize) :
    						"");
    		
    		return r;
    	},
        model: ConversationReference,
        exposedFields: ConversationReferenceExposedFields,
        
        initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.folder = options.folder;
        	this.page = options.page;
        	this.pageSize = options.pageSize;
        	this.conversation = options.conversation;
        },

    	alreadyIn: function(folder)
    	{
    		return _.size(this.where({folder: folder.id})) > 0;
    	},
    	
    	removeFromFolder: function(folder)
    	{
    		var references = this.where({folder: folder.id});
    		
    		_.each(references, function(reference) {
				reference.destroy();
				this.remove(reference);
				
				folder.getConversations().removeReference(reference.id);
    		}, this);
    	},
    	
    	removeFromAllFolders: function()
    	{
    		while(this.length)
    		{
    			var reference = this.pop();
    			var folder = appSingleton.user.getFolders().get(reference.get('folder'));
				folder.getConversations().removeReference(reference.id);

				reference.destroy();
    		}
    	},
    	
    	addToFolder: function(folder)
    	{
    		var reference = new this.model({conversation:this.id, folder:folder.id, syncId:Util.guid()});
    		reference.conversation = this.conversation;
    		reference.save();

    		this.add(reference);
    		folder.getConversations().addReference(reference);
    	},
    	
    	markDate: function(date)
    	{
    		this.syncedOnce(function() {
    			_.each(this.models, function(model) {
    				model.set('date', date);
    				model.save();
    			});
    		});
    	}
    });
    
	// @TODO what should this be?
    ConversationReferencePages = Backbone.Model.extend({
    	
    	url: function () { 
    		var r = 
    			Constants.REST + 'ConversationReferences' +
    				'?field=' + this.field + 
    				"&id=" + this.id + 
    				"&orderBy=date&orderDirection=-1" +
    				"&onlyCount";
    		
    		return r;
    	},
    	
    	
        initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.folder = options.folder;
        	this.pages = {};
        	this.pageSize = 50;
        },

        getPage: function(index)
    	{
        	if (_.has(this.pages, index))
        		return this.pages[index];

        	var page = new ConversationReferences([], { field: this.field, id: this.id, folder:this.folder, pageSize:this.pageSize, page:index });
        	page.fetch();
        	
        	this.pages[index] = page;
    		return page;
    	},
    	
    	addReference: function(reference)
    	{
    		// @TODO what should this do, needs to be sorted of course
    		this.getPage(0).unshift(reference);
    	},
    	
    	removeReference: function(referenceId)
    	{
    		//@TODO each page
    		this.getPage(0).remove(referenceId);
    	}
    });
});
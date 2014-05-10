define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {
	
	FolderExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];

    Folder = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Folder',
    	conversations: null,
    	exposedFields: FolderExposedFields,
    	
        getConversations: function() 
        {
        	if (!this.conversations) {
        		this.conversations = new ConversationReferencePages([], { field:'folder', id:this.id, folder:this });
        		this.conversations.fetch();
        	}
        	return this.conversations;
        },
        
        matches: function(conversation, kv)
        {
        	if (kv[0] == 'all')
        		return true;
        	
        	if (kv[0] == 'filter')
        	{
        		kv[1] = this.id;
        		var matches = false;
        		
        		var tags = conversation.get('filterFolders') || [];
        		var matching = [ kv[1] ];
        		_.each(matching, function(m) {
        			matches = matches || _.contains(tags, m);
        		});
        		
        		return matches && (tags.length > 0);
        	}
        	
        	return conversation.get(kv[0])==kv[1];
        },
        
        shouldInclude: function(conversation)
        {
        	var matches = false;
        	_.each(_.pairs(this.get('inclusion_criteria')), function(kv) {
        		matches = matches || this.matches(conversation, kv);
        	}, this);
        	
        	return matches;
        },
        
        shouldExclude: function(conversation)
        {
        	var matches = false;
        	_.each(_.pairs(this.get('exclusion_criteria')), function(kv) {
        		matches = matches || this.matches(conversation, kv); 
        	}, this);
        	
        	return matches;
        }
    });

    Folders = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Folders?field=' +this.field + "&id="+ this.id; },
        model: Folder,
        exposedFields: FolderExposedFields,
        
        initialize:function(objects, options)
        {
        	_.bindAll(this, 'preload');

        	this.field = options.field;
        	this.id = options.id;
        	this.user = options.user;
        	
        	this.on('add', this.preload);
        },
        
        preload: function(model)
        {
        	// @TODO move this somewhere else
        	model.getConversations().getPage(0);
        },
        
        markDateAndRecomputeConversationMemberships: function(conversation)
        {
        	var that = this;
			// go through and add to relevant folders
			// also test if the conversation should be removed from folders it is already in
			var references = conversation.getReferences();
			
			references.syncedOnce(function() { 
				references.markDate(conversation.get('date'));
				
				_.each(that.models, function(folder) {
					
					if (references.alreadyIn(folder))
					{
						if (!folder.shouldInclude(conversation) || folder.shouldExclude(conversation))
						{
							references.removeFromFolder(folder);
						}
						else
						{
							references.adjustByDateInFolder(folder);
						}
					}
					else
					if (folder.shouldInclude(conversation) && !folder.shouldExclude(conversation))
					{
						references.addToFolder(folder);
					}
				});
			});
        }
    });
});
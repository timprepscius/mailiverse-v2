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
        	}
        	return this.conversations;
        },
        
        shouldInclude: function(conversation)
        {
        	var matches = false;
        	_.each(_.pairs(this.get('inclusion_criteria')), function(kv) {
        		matches = matches || (conversation.get(kv[0])==kv[1]) || (kv[0] =='all');
        	}, this);
        	
        	return matches;
        },
        
        shouldExclude: function(conversation)
        {
        	var matches = false;
        	_.each(_.pairs(this.get('exclusion_criteria')), function(kv) {
        		matches = matches || (conversation.get(kv[0])==kv[1]); 
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
        
        recomputeConversationMemberships: function(conversation)
        {
        	var that = this;
			// go through and add to relevant folders
			// also test if the conversation should be removed from folders it is already in
			var references = conversation.getReferences();
			
			references.syncedOnce(function() { 
				_.each(that.models, function(folder) {
					if (references.alreadyIn(folder))
					{
						if (!folder.shouldInclude(conversation) || folder.shouldExclude(conversation))
						{
							references.removeFromFolder(folder);
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
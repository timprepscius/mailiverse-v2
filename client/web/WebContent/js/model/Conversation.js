define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	ConverationExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
    Conversation = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Conversation',
    	mails: null,
    	references: null,
    	exposedFields: ConverationExposedFields,
    	
    	onCreate: function ()
    	{
        	if (!this.mails)
        		this.mails = new Mails([], { field:'conversation', id:this.id, conversation:this });

        	if (!this.references)
        		this.references = new ConversationReferences([], {field:'conversation', id:this.id, conversation:this });

        	this.mails.onCreate();
    		this.references.onCreate();
    		
    		Backbone.Model.prototype.onCreate.apply(this);
    	},
    	
        getMails: function() {
        	if (!this.mails) {
        		this.mails = new Mails([], { field:'conversation', id:this.id, conversation:this });
        		this.mails.fetch();
        	}
        	return this.mails;
        },
        
        newMail: function () {
    		var mail = new Mail({conversation: this.id, syncId:Util.guid(), date:Util.toDateSerializable()});
    		mail.onCreate();
    		mail.assignNewId();
    		mail.set('sendEncrypt', true);
    		mail.set('sendSign', true);
    		mail.set('sendTextOnly', false);

    		mail.set('draft', true);
    		
    		this.getMails().add(mail);
    		return mail;
        },
        
        getReferences: function()
        {
        	if (!this.references)
        	{
        		this.references = new ConversationReferences([], {field:'conversation', id:this.id, conversation:this});
        		this.references.fetch();
        	}
        	return this.references;
        },
                
        userFriendlyDate : function()
        {
        	return Util.getUserFriendlyDate(this.get('date'));
        },
        
        getFromFirstNames: function()
        {
        	return _.map(this.get('from'), Util.getNameFromEmail).join(', ');
        },
        
        recomputeAttributesAndFolderMemberships: function()
        {
        	var that = this;
        	this.getMails().syncedOnce(function () {
	    		var from = {};
	    		var subject = null;
	    		var sent = false;
	    		var received = false;
	    		var dictionary = {};
	    		var date = null;
	    		var draft = null;
	    		var filterTags = [];
	    		var filterFolders = [];
	    		var skipInbox = false;
	    		
	    		_.each(
	    			that.getMails().models, 
	    			function(mail) {
	    				subject = subject || mail.getTrimmedSubject();
	    				
	    				if (mail.get('from'))
	    					from[mail.get('from')] = true;
	    				
	    				if (mail.get('sent'))
	    					sent = true;
	    				
	    				if (mail.get('received'))
	    					received = true;
	    				
	    				if (mail.get('draft'))
	    					draft = true;

	    				if (mail.get('dictionary'))
	    					_.extend(dictionary, mail.get('dictionary'));
	    				
	    				if (mail.get('filterTags'))
	    					filterTags = _.union(tags, mail.get('filterTags'));
	    				
	    				if (mail.get('filterFolders'))
	    					filterFolders = _.union(filterFolders, mail.get('filterFolders'));

	    				if (date == null || mail.get('date') > date)
	    					date = mail.get('date');
	    				
	    				if (mail.get('skipInbox'))
	    					skipInbox = true;
	    			}
	    		);
	    		
	    		if (!subject)
	    			subject = 'No subject';
	    		
	    		that.set('from', _.keys(from));
	    		that.set('sent', sent);
	    		that.set('received', received);
	    		that.set('dictionary', dictionary);
	    		that.set('date', date);
	    		that.set('subject', subject);
	    		that.set('draft', draft);
	    		that.set('filterTags', filterTags);
	    		that.set('filterFolders', filterFolders);
	    		that.set('skipInbox', skipInbox);
	    		
	    		that.trigger('recompute');
	    		that.save();
	    		
	    		appSingleton.user.getFolders().markDateAndRecomputeConversationMemberships(that);
        	});
        },
    });

    Conversations = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Conversations?field=' +this.field + "&id="+ this.id; },
        model: Conversation,
        exposedFields: ConverationExposedFields,
        
        initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.user = options.user;
        },
    });
});
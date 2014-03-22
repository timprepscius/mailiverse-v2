define([
	'jquery',
	'underscore',
	'backbone',
	'base16',
], function ($,_,Backbone) {

	MailExposedFields = [ 'syncId', 'syncOwner', 'syncVersion', 'conversation' ];

    Mail = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Mail',
    	exposedFields: MailExposedFields,
    	
    	getParentConversation: function () 
    	{
    		return this.collection.conversation;
    	},

    	getTrimmedSubject: function()
    	{
    		var subject = this.get('subject');
    		if (!subject)
    			subject = "";
    		
    		while (subject.toLowerCase().startsWith('re:'))
    		{
    			subject = subject.substr(3).trim();
    		}
    		
    		return subject;
    	},
    
    	getReplyTo: function()
    	{
    		if (this.get('reply-to'))
    			return this.get('reply-to');
    		return this.get('from');
    	},
    	
    	getFromName: function ()
    	{
    		return Util.getNameFromEmail(this.get('from'));
    	},
    	
    	getFromAddress: function ()
    	{
    		return Util.getAddressFromEmail(this.get('from'));
    	},
    	
    	getEmailAddresses: function (sources_)
    	{
    		var sources = sources_ || ['from', 'to', 'cc', 'bcc'];
    		var addresses = {};
    		_.each(sources, function(source) {
    			var str = this.get(source);
    			if (str)
    			{
	    			var values = Util.splitAndTrim(this.get(source), ',');
	    			_.each (values, function (value) {
    					addresses[value] = true;
	    			});
    			}
    		}, this);
    		
    		return _.keys(addresses);
    	},
    	
    	getAddresses: function(sources)
    	{
    		return _.map(this.getEmailAddresses(sources), Util.getAddressFromEmail);
    	},
    	
    	getRecipientAddresses: function()
    	{
    		return this.getAddresses(['to', 'cc', 'bcc']);
    	},
    	
    	addTagToBodyPart: function (hash, key, value)
    	{
    		_.each (this.get('content'), function(part) {
    			if (part.hash == hash || true)
    			{
    				part.tags[key] = value;
    			}
    		});
    	},
    	
    	recomputeParent: function()
    	{
    		this.getParentConversation().recomputeAttributesAndFolderMemberships();
    	},
    	
    	getText: function()
    	{
    		var val = _.findWhere(this.get('content'), { type:'text' });
    		return val ? val.content : null;
    	},
    	
    	getOrSynthesizeText: function()
    	{
    		var text = this.getText();
    		if (!text)
    		{
    			var html = this.getHtml();
    			if (html)
    				return Util.toText(html);
    		}
    		
    		return null;
    	},
    	
    	getHtml: function()
    	{
    		var val = _.findWhere(this.get('content'), { type:'html' });
    		return val ? val.content : null;
    	},
    	
    	assignNewId: function()
    	{
    		this.set('message-id', Util.guid() + Constants.ATHOST);
    		this.computeIdFromMessageId();
    	},
    	
    	computeIdFromMessageId: function()
    	{
			var mailId = this.has('message-id') ? this.get('message-id') : Util.guid();
			this.set('syncId', Crypto.cryptoHash16(appSingleton.login.get('privateKeys').aes, mailId));
    	},
    });

    Mails = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Mails?field=' +this.field + "&id="+ this.id; },
        model: Mail,
    	exposedFields: MailExposedFields,
    	
        initialize: function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.conversation = options.conversation;
        },
    });
});
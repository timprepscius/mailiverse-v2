define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {
	
	FilterExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];

    Filter = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Filter',
    	conversations: null,
    	exposedFields: FilterExposedFields,
    	
        matches: function(mail)
        {
        	var results = _.map(this.get('criteria'), function(criteria) {
        		
    			var value = conversation.get(criteria.field);
    			var re = new RegExp(criteria.regularExpression);
	
    			if (re.test(value))
    				return true;
        			
    			return false;
        	});
        
        	if (this.get('mustMatch') == 'all')
        		return _.every(results);
        	else
        	if (this.get('mustMatch') == 'some')
        		return _.some(results);
        		
        	return false;
        },
        
        applyTo: function(mail)
        {
        	if (this.matches(mail))
        	{
        		mail.applyTags(this.get('tags'));
        	}
        },
    });

    Filters = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Filters?field=' +this.field + "&id="+ this.id; },
        model: Folder,
        exposedFields: FilterExposedFields,
        
        initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.user = options.user;
        },
        
        applyTo: function(conversation, mail)
        {
        	this.each(function(filter) {
        		filter.applyTo(conversation, mail);
        	});
        }
    });
    
});
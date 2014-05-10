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
        	var criteria = [];
        	var fields = ['to', 'cc', 'from', 'subject', 'body'];
        	_.each(fields, function(f) {
            	if (this.get(f))
            		criteria.push({ field: f, match: this.get(f) });
        		
        	}, this);
        	
        	var results = _.map(criteria, function(criteria) {
        		
    			var value = mail.get(criteria.field);
    			if (value.toLowerCase().indexOf(criteria.match.toLowerCase()) != -1)
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
        		mail.applyFilter(this);
        	}
        },
    });

    Filters = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Filters?field=' +this.field + "&id="+ this.id; },
        model: Filter,
        exposedFields: FilterExposedFields,
        
        initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.user = options.user;
        },
        
        applyTo: function(mail)
        {
        	this.each(function(filter) {
        		filter.applyTo(mail);
        	});
        }
    });
    
});
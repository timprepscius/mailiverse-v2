define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	ContactExposedFields = [ 'syncId', 'syncOwner', 'syncVersion' ];
	
    Contact = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Contact',
    	exposedFields: ContactExposedFields,
    	
    	getAddress: function ()
    	{
    		return Util.getAddressFromEmail(this.get('email'));
    	}
    });

    Contacts = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Contacts'; },
        model: Contact,
        exposedFields: ContactExposedFields,
        
        initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.user = options.user;
        },
        
        getContact: function(email)
        {
        	return this.findWhere({ email: email });
        },

        ensureContact: function(email)
        {
        	var model = this.findWhere({ email: email });
        	if (!model)
        	{
        		model = new this.model({ syncId: Util.guid(), email: email }); 
        		model.save();
        		this.add(model);
        	}
        	
        	return model;
        },
    });
});
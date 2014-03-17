define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	// the recent date will be the last month MM/01/YYYY last seen used.
	// I don't want to expose when you talked to this guy, but I do want to allow
	// for getting contacts in order of use
	ContactExposedFields = [ 'syncId', 'syncOwner', 'syncVersion', 'date', 'nameHash' ];
	
    Contact = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Contact',
    	exposedFields: ContactExposedFields,
    	
    	getKeyStatus: function ()
    	{
    		var keyStatus = this.get('keyStatus');
    		if (!keyStatus)
    			return 'none';
    		
    		if (keyStatus.status)
        		return keyStatus.status;
    		
    		return 'none';
    	}
    });

    Contacts = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Contacts?field=' +this.field + "&id="+ this.id +"&orderBy=date"; },
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
        	var nameHash = Crypto.cryptoHash(appSingleton.login.get("privateKeys").aes, email);
        	var model = this.get(nameHash);
        	return model;
        },

        ensureContact: function(email)
        {
        	var nameHash = Crypto.cryptoHash(appSingleton.login.get("privateKeys").aes, email);
        	var model = this.get(nameHash);
        	if (!model)
        	{
        		model = new this.model({ syncId: nameHash, date: Util.toDateSerializable(), email: email }); 
        		model.fetchOrCreate();
        		this.add(model);
        	}
        	
        	return model;
        },
    });
});
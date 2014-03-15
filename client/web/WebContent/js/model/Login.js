define([
	'jquery',
	'underscore',
	'backbone',
], function ($,_,Backbone) {

	LoginExposedFields = [ 'syncId', 'syncOwner', 'syncVersion', 'verification', 'publicKey', 'address' ];
	
    Login = Backbone.Model.extend({
    	idAttribute: "syncId",
    	exposedFields: LoginExposedFields,
    });

});
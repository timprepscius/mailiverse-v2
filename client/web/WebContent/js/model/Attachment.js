define([
	'jquery',
	'underscore',
	'backbone',
	
	'constants',
], function ($,_,Backbone) {

	AttachmentExposedFields =  [ 'syncId', 'syncOwner', 'syncVersion', 'mail' ];
	
    Attachment = Backbone.Model.extend({
    	idAttribute: "syncId",
    	urlRoot: Constants.REST + 'Attachment',
    	mails: null,
    	
    	exposedFields: AttachmentExposedFields,
    });

    Attachments = Backbone.Collection.extend({
    	url: function () { return Constants.REST + 'Attachments?field=' +this.field + "&id="+ this.id; },
        model: Mail,
    	exposedFields: AttachmentExposedFields,

    	initialize:function(objects, options)
        {
        	this.field = options.field;
        	this.id = options.id;
        	this.folder = options.folder;
        },
    });
});
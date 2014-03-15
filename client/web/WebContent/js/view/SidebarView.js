define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/sidebarTemplate.html',

	'modelBinder',
], function ($,_,Backbone,sidebarTemplate) {
	
	SidebarView = Backbone.View.extend({
		
        events: {
        	'click #main-compose-button': 'onCompose',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.mainView = options.mainView;
        	
        	_.bindAll(this, 'onCompose');
        },
        
        onCompose: function()
        {
        	this.mainView.loadCompose();
        },
        
        render: function( model ) {
        	var rendered = _.template(sidebarTemplate, { model: this.model });
            this.$el.html(rendered);
            
        	this.folderListView = new FolderListView({ el: this.$('#sidebar-folders'), collection:this.mainView.user.getFolders()});
        	this.folderListView.render();

            return this;
        },
        
	});

});
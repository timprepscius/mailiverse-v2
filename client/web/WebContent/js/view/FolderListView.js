define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/folderListItemTemplate.html',
	'text!templates/folderListTemplate.html',

	'modelBinder',
], function ($,_,Backbone,folderListItemTemplate, folderListTemplate) {
	
	FolderListActiveFolder = null;
	
	FolderListViewItem = Backbone.View.extend({
		
        events: {
            'click' : 'onClick',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	_.bindAll(this, 'onClick');
        },
        
        onClick: function(event)
        {
        	if (FolderListActiveFolder)
        		FolderListActiveFolder.$el.removeClass("active");
        	
        	this.$el.addClass("active");
        	FolderListActiveFolder = this;
        	appSingleton.mainView.loadFolder(this.model);
        },
        
        render: function( model ) {
        	var that = this;
        	
        	var rendered = _.template(folderListItemTemplate, { model: this.model });
            $(this.el).html(rendered); 
            
            return this;
        },
        
	});
	
    FolderListView = Backbone.View.extend({

    	events: {
        	'click #sidebar-folderlist-add': 'onNewFolder',
        	'click #sidebar-folderlist-remove': 'onDeleteFolder',
        	'click #sidebar-folderlist-rename': 'onRenameFolder'
    	},
    	
        initialize: function(options) 
        {
            var that = this;
            _.bindAll(this, 'render');

            this.collection.bind("sync", function( model ){
                that.render( );
            });
            
            var timeout = null;
            this.collection.bind("all", function( model ){
            	if (timeout)
            		clearTimeout(timeout);
                timeout = setTimeout(function() { that.render(); }, 100);
            });
            
            this.views = {};
        	_.bindAll(this, 'onNewFolder', 'onDeleteFolder', 'onRenameFolder');
        },
        
        onNewFolder: function()
        {
        	this.collection.create({ 
        		name:'Unnamed', 
        		user:this.collection.id, 
        		custom:true,
    			inclusion_criteria : { filter: true }, 
        	});
        },
        
        onDeleteFolder: function()
        {
        	alert('onDeleteFolder');
        	
        },
        
        onRenameFolder: function()
        {
        	alert('onRenameFolder');
        	
        },
                
        render: function() {
        	this.$el.html(_.template(folderListTemplate));
        	
        	_.each(
        		this.collection.sortBy('ordering').reverse(),
        		
        		function(model) 
        		{
        			if (!_.has(this.views, model.cid))
        			{
		                var view = new FolderListViewItem({ tagName:'li', model: model });
		                view.render();
		                this.views[model.cid] = view;
        			}
        			
        			var view = this.views[model.cid];
        			view.delegateEvents();
	                $(view.el).insertAfter(this.$('#sidebar-folderlist-marker'));
            	}, 
            	
            	this
            );
        	
        	return this;
        }
    });  
});
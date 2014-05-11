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
            'keydown .folder-name-input': 'onChange'
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	_.bindAll(this, 'onClick', 'onChange');
        },
        
        onClick: function(event)
        {
        	if (FolderListActiveFolder)
        		FolderListActiveFolder.$el.removeClass("active");
        	
        	this.$el.addClass("active");
        	FolderListActiveFolder = this;
        	appSingleton.mainView.loadFolder(this.model);
        },
        
        onEdit: function()
        {
        	this.$('.folder-name-input').removeClass('hide');
        	this.$('.folder-name-label').addClass('hide');
        },
        
        onFinishEdit: function()
        {
        	this.model.set('name', this.$('.folder-name-input').val());
        	this.$('.folder-name-label').removeClass('hide');
        	this.$('.folder-name-input').addClass('hide');
        	
        	this.model.save();
        },
        
        onChange: function(event)
        {
        	if (event.keyCode == 13)
        		this.onFinishEdit();
        },
        
        render: function( model ) 
        {
        	var that = this;
        	
        	var rendered = _.template(folderListItemTemplate, { model: this.model });
            $(this.el).html(rendered); 

            var mb = new Backbone.ModelBinder();
            this.modelBinders.push(mb);
            mb.bind(this.model, this.el);            

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
        	FolderListActiveFolder.onEdit();
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
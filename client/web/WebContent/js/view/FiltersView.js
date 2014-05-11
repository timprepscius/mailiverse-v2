define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/filterTemplate.html',
	'text!templates/filtersTemplate.html',

	'modelBinder',
], function ($,_,Backbone,filterTemplate, filtersTemplate) {
	
	FilterView = Backbone.View.extend({
		
        events: {
            'click .delete' : 'onDelete',
            'click .save' : 'onSave',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	_.bindAll(this, 'onDelete');
        },
        
        onDelete: function(event)
        {
        	this.model.destroy();
        },
        
        onSave: function(event)
        {
        	var keys = ['from', 'to', 'cc', 'subject', 'body', 'folder', 'mustMatch' ];
        	_.each(keys, function(key) {
        		this.model.set(key, this.$('[name=' + key + ']').val());
        	}, this);
        	
        	
        	this.model.set('skipInbox', this.$('[name=skipInbox]').val() == 'on');
        	
        	this.model.save();
        },
        
        render: function( model ) {
            var mb = new Backbone.ModelBinder();
            this.modelBinders.push(mb);

        	var rendered = _.template(filterTemplate, { model: this.model, folders:appSingleton.user.getFolders() });
            $(this.el).html(rendered);

            mb.bind(this.model, this.el);
            
            // this doesn't work
            // this.$('.selectpicker').selectpicker();

            return this;
        },
        
	});
	
    FiltersView = Backbone.View.extend({

    	events: {
        	'click #filters-add': 'onNewFilter',
    	},
    	
        initialize: function(options) 
        {
            var that = this;
            _.bindAll(this, 'render');

            this.collection.bind("sync", function( model ){
                that.renderItems( );
            });
            
            var timeout = null;
            this.collection.bind("all", function( model ){
            	if (timeout)
            		clearTimeout(timeout);
                timeout = setTimeout(function() { that.renderItems(); }, 100);
            });
            
            this.collection.syncedOnce(function() {
            	that.renderItems();
            });
            
            this.views = {};
        	_.bindAll(this, 'onNewFilter', 'onDeleteFilter');
        },
        
        onNewFilter: function()
        {
        	this.collection.create({ name:'Unnamed', from:'', to:'', cc:'', subject:'', body:'', folder:null, mustMatch:'some' });
        },
        
        onDeleteFilter: function()
        {
        	alert('onDeleteFolder');
        },
        
        renderItems: function() {
        	
        	this.$('.filters-list').html('');
        	
        	_.each(
        		this.collection.models,
        		function(model) 
        		{
        			if (!_.has(this.views, model.cid))
        			{
		                var view = new FilterView({ model: model });
		                view.render();
		                this.views[model.cid] = view;
        			}
        			
        			var view = this.views[model.cid];
        			view.delegateEvents();
        			this.$('.filters-list').append(view.el);
            	}, 
            	
            	this
            );
        	
        },
        
        render: function() {
        	this.$el.html(_.template(filtersTemplate));
            this.$('#filters-modal').modal({ show: true });    
            return this;
        },
    });  
});
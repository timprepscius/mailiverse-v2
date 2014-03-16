define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/conversationListItemTemplate.html',
	'text!templates/conversationListPageTemplate.html',
	'text!templates/conversationListTemplate.html',

	'modelBinder',
], function ($,_,Backbone,conversationListItemTemplate, conversationListPageTemplate, conversationListTemplate) {
	
	ConversationListViewItem = Backbone.View.extend({
		
        events: {
            'click' : 'onClick',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.modelReference = options.modelReference;
			this.model = this.modelReference.getConversation();

        	_.bindAll(this, 'onClick');
        },
        
        onClick: function(event)
        {
        	appSingleton.mainView.loadConversation(this.model);
        },
        
        render: function() {
        	var that = this;
        	var rendered = _.template(conversationListItemTemplate, { model: this.model });
            this.$el.html(rendered);
            
            var mb = new Backbone.ModelBinder();
            var bindings = {
            	from: { selector: '[name=from]', converter: function() { return that.model.getFromFirstNames(); } },
        		subject: { selector: '[name=subject]' }, 
            	date: { selector: '[name=formatted_date]', converter: function() { return that.model.userFriendlyDate(); } },
            	draft: { selector: '[name=draft]', converter: function() { return that.model.get('draft') ? 'Draft' : '' } },
            	draft: { selector: '[name=sending]', converter: function() { return that.model.get('sending') ? 'Sending' : '' } },
            } ;
            this.modelBinders.push(mb);
            mb.bind(this.model, this.el, bindings);
            
            return this;
        },
        
	});
	
	ConversationListViewPage = Backbone.View.extend({

        initialize: function(options) 
        {
        	var that = this;
            _.bindAll(this, 'render', 'onAppear', 'onDisappear', 'checkAppeared');
            
            this.parent = options.parent;
        	this.views = {};

            this.collection.on('all', function () {
        		Util.keyTimeout("ConversationListViewPage-collection-all-" + that.collection.page, 100, that.render);
            });
            
            this.$el.on('appear', this.onAppear);
            this.$el.on('disappear', this.onDisappear);

            // this doesn't work right, so I rig my own
            // this.$el.appear();
        	this.appearedState = false;
        	this.checkAppearedTimeout = setInterval(this.checkAppeared, 250);
        },
        
        checkAppeared: function()
        {
        	var lastState = this.appearedState;
        	this.appearedState = this.$el.is(":appeared");
        	if (lastState != this.appearedState)
        		this.appearedState ? this.onAppear() : this.onDisappear();
        },
        
        onAppear: function()
        {
        	this.parent.onAppear(this.collection.page, this);
        },
        
        onDisappear: function()
        {
        	this.parent.onDisappear(this.collection.page, this);
        },
                       
        render: function() {
        	this.$el.html(_.template(conversationListPageTemplate, { model : this.collection }));

        	_.each(
        		this.collection.models,
        		
        		function(model) 
        		{
        			if (!_.has(this.views, model.cid))
        			{
		                var view = new ConversationListViewItem({ tagName:'tr', modelReference: model });
		                view.render();
		                this.views[model.cid] = view;
        			}
        			
        			var view = this.views[model.cid];
        			view.delegateEvents();
	                this.$el.append(view.el);
            	}, 
            	
            	this
            );
        	
        	return this;
        }
    });  

	ConversationListView = Backbone.View.extend({

	    initialize: function(options) 
        {
        	var that = this;
            _.bindAll(this, 'render', 'onSync');
            this.isLoading = false;
            this.maxPages = 0;
            this.numPagesDisplayed = 0;
            this.pageSize = 50;
            this.views = [];
            
            // fill in the container html immediately
    		this.$el.html(_.template(conversationListTemplate, { model : this.collection }));

    		if (this.collection.isSyncedOnce())
            	this.onSync();
            
            this.collection.on("sync", this.onSync);
            
            this.collection.bind("addPage", function(){ 
            	Util.keyTimeout("ConversationListView-collection-all", 100, that.render);
            });
        },
        
        onSync: function()
        {
        	this.maxPages = Math.ceil(this.collection.get('count') / this.pageSize);
        	
        	if (this.views.length < this.maxPages && 
        		(this.views.length == 0 || this.views[this.views.length-1].$el.is(":appeared")))
        		
        		this.addPage();
        },
        
        onAppear: function(page, view)
        {
        	console.log('onAppear', page);
        	while (this.views.length <= page+1 && this.views.length < this.maxPages)
        		this.addPage();
        },
        
        onDisappear: function(page, view)
        {
        	console.log('onDisappear', page);
        	
        },
        
        addPage: function() {
        	var page = this.views.length;
            var view = new ConversationListViewPage({ parent: this, tagName:'tbody', collection: this.collection.getPage(page), page:page });
            view.render();
            this.views.push(view);
            
            this.collection.trigger('addPage');
        },
                        
        render: function() 
        {
    		for (; this.numPagesDisplayed<this.views.length; this.numPagesDisplayed++)
    		{
    			var view = this.views[this.numPagesDisplayed];
                this.$("#main-conversation-list-pages").append(view.el);
    			view.delegateEvents();
    		}
            
        	return this;
        }
    });  

});
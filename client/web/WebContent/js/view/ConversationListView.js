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
            _.bindAll(this, 'render');
            this.collection.on('all', function () {
        		Util.keyTimeout("ConversationListViewPage-collection-all", 100, that.render);
            });
        	this.views = {};
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

		events: {
			'scroll': 'checkScroll'
		},
		
		checkScroll: function () 
		{
			var triggerPoint = 100; // 100px from the bottom
			if( !this.isLoading && this.el.scrollTop + this.el.clientHeight + triggerPoint > this.el.scrollHeight ) {
				this.twitterCollection.page += 1; // Load next page
				this.loadResults();
			}
		},

	    initialize: function(options) 
        {
        	var that = this;
            _.bindAll(this, 'render');
            this.isLoading = false;
            
            this.collection.bind("all", function(){ 
//            	Util.keyTimeout("ConversationListView-collection-all", 100, that.render);
            });
            
            this.views = {};
        	_.bindAll(this, 'render');
        },
                        
        render: function() {
        	this.$el.html(_.template(conversationListTemplate, { model : this.collection }));

        	if (this.collection.synced)
        		this.$("#main-conversation-list-pages").empty();
        	
            var view = new ConversationListViewPage({ tagName:'tbody', collection: this.collection.getPage(0), page:0 });
            view.render();
            this.views[view.page] = view;
			view.delegateEvents();
            this.$("#main-conversation-list-pages").append(view.el);
        	
        	return this;
        }
    });  

});
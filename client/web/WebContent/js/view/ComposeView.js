define([
        'jquery',
        'underscore',
        'backbone',
        'text!templates/composeTemplate.html',

        'modelBinder',
        'ckeditor',
        'ckeditor_adapter',
        ], function ($,_,Backbone,composeTemplate) {

	ComposeView = Backbone.View.extend({

		events: {
			'click .send' : 'onSend',
			'click .save' : 'onSave',
			'click .discard' : 'onDiscard',
		},

		locks : {
			to: 'none',
			cc: 'none',
			bcc: 'none',
		},
		
		inputs: {
		},
		
		initialize: function(options) 
		{
			this.partialView = null;
			this.fullView = null;
			_.bindAll(this, 'render', 'onSend', 'onAddressChange');
			
			this.model.on('changed', this.render);
		},

		render: function() {
			var that = this;
			var rendered = _.template(
				composeTemplate, { 
					model: this.model, 
					replyTo: this.replyTo, 
					conversation: this.model.conversation 
			});
			this.$el.html(rendered);
			
			
			var typeaheadContacts = new Bloodhound({
			  datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.value); },
			  queryTokenizer: Bloodhound.tokenizers.whitespace,
			  local: []
			});
			
			_.each(['to', 'cc', 'bcc'], function(k) {
				var f = that.model.get(k);
				var input = that.$('.' + k + ' input').not(':disabled');

				$(input).on('tokenfield:createtoken tokenfield:removetoken tokenfield:edittoken', function() {
					that.onAddressChange(this);
				});
				$(input).bind('input', function() {
					that.onAddressChange(this);
				});
				$(input).bind('keyup', function() {
					that.onAddressChange(this);
				});
				
				$(input).tokenfield({
				  allowDuplicates: true,
				  typeahead: {
					  displayKey: 'label',
					  source: typeaheadContacts.ttAdapter(),
					  templates: {
						    suggestion: function (model) {
						      return '<p><span class="email">' + Util.toHtml(model.value) + '</span>';
						    }
						  }				  
				  },
				});
				
				this.onAddressChangeAfterDelay(input);
				
				$(input).tokenfield('setTokens', 
					_.map(Util.splitAndTrim(f, ','), function(email) {
						return { value: email, label: Util.getNameFromEmail(email) };
					})
				);
			}, that);
			
			appSingleton.user.getContacts().syncedOnce( function () {
				var typeaheadContactsLocal = _.map(appSingleton.user.getContacts().models,
					function (model) {
						return { value: model.get('email'), label: Util.getNameFromEmail(model.get('email')) };
					}
				);
				
				typeaheadContacts.add(typeaheadContactsLocal);
			} );

			this.$('.send-encrypt input').attr('checked', this.model.get('sendEncrypted'));
			this.$('.send-sign input').attr('checked', this.model.get('sendSigned'));
			this.$('.send-text-only input').attr('checked', this.model.get('sendTextOnly'));
			
			this.ckeditor = this.$('.textarea').ckeditor();
			var body = this.model.getHtml();
			if (body)
				this.ckeditor.val(body);
			
			return this;
		},
		
		onAddressChange: function (input)
		{
			var that = this;
			console.log("onAddressChange");
			
			Util.keyTimeout('composeview-' + input.name, 1000, function() { that.onAddressChangeAfterDelay(input); });
		},
		
		onAddressChangeAfterDelay: function (input)
		{
			var that = this;
			var addresses = _.map($(input).val().split(','), function(email) { 
				return Util.getAddressFromEmail(email.trim()); 
			});
			addresses = _.without(addresses, '', null);
			
			function callback(state) {
				var div = $(input).parents('.input-group');
				Util.addOrRemoveClass(div, 'pgp-verified', state=='verified' && addresses.length>0);
				Util.addOrRemoveClass(div, 'pgp-keys', state=='keys' && addresses.length>0);
				that.locks[input.name] = addresses.length ? state : 'none';
				that.updateSendLock();
			};
			
			function computeState(addressesToKeyInfos) {
				return _.every(_.values(addressesToKeyInfos), function(key) {
					return key.get('verified')=='success';
				}) ? 'verified' : 'keys';
			};

			appSingleton.user.getKeyRing().getKeyInfoForAddresses(addresses, {
				success: function(addressesToKeyInfos) { 
					callback(computeState(addressesToKeyInfos)); 
				},
				failure: function() { callback('failure'); },
			});
		},
		
		updateSendLock: function ()
		{
			var allVerified = _.every(_.values(this.locks), function(x) { return x=='verified' || x=='none'; });
			var allKeys = _.every(_.values(this.locks), function(x) { return x != 'failure'; });
			Util.addOrRemoveClass(this.$('.send-encrypt-marker'), 'pgp-verified', allVerified);
			Util.addOrRemoveClass(this.$('.send-encrypt-marker'), 'pgp-keys', allKeys && !allVerified);

			Util.addOrRemoveClass(this.$('.send-encrypt'), 'disable', !allKeys);

			this.model.set('canSendEncrypted', allKeys);
			this.$('.send-encrypt input').attr('disabled', !allKeys);
		},

		onSend: function ()
		{
			this.onSave();
			appSingleton.sendMail(this.model);
			appSingleton.mainView.closeCurrentView();
		},
		
		onSave: function()
		{
			var val = this.ckeditor.ckeditorGet().getData();

			this.model.set('content', [
			 	{ type: 'html', content: val, tags:{}}
			 ]);
			
			this.model.set('sendEncrypted', this.$('.send-encrypt input').is(':checked'));
			this.model.set('sendSigned', this.$('.send-sign input').is(':checked'));
			this.model.set('sendTextOnly', this.$('.send-text-only input').is(':checked'));
			
			this.model.set('to', this.$('.to input').not(':disabled').val());
			this.model.set('cc', this.$('.cc input').not(':disabled').val());
			this.model.set('bcc', this.$('.bcc input').not(':disabled').val());
			this.model.set('subject', this.$('.subject input').not(':disabled').val());
			this.model.set('from', 'me');
			this.model.set('date', Util.toDateSerializable());
			this.model.save();
			
			this.model.getParentConversation().recomputeAttributesAndFolderMemberships();
		},
		
		onDiscard: function()
		{
			var conversation = this.model.getParentConversation();
			conversation.getMails().remove(this.model);
			this.model.destroy();
			
			if (conversation.getMails().length == 0)
			{
				conversation.getReferences().syncedOnce(function(){
					conversation.getReferences().removeFromAllFolders();
					conversation.destroy();
				});
				
				appSingleton.mainView.closeCurrentView();
			}
			else
			{
				conversation.recomputeAttributesAndFolderMemberships();
				conversation.save();
			}
		}
	});

});
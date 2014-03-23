define([
        'jquery',
        'underscore',
        'backbone',
        ], function ($,_,Backbone) {

	MailReceiver = Backbone.View.extend({

		originals: null,
		callbacks: null,
		
		initialize: function(options) 
		{
			_.bindAll(this, 'render', 'onRequirementsMet', 'onProcess');
			this.on('next', this.onProcess);
		},

		start: function(callbacks)
		{
			this.callbacks = callbacks;
			this.originals = appSingleton.user.getNewMail();
			this.requirements(this.onRequirementsMet);
		},
		
		requirements: function(fn)
		{
			// this is not the best way of doing this
			this.originals.syncedOnce(function () {
			appSingleton.user.getConversations().syncedOnce(function() {
			appSingleton.user.getContacts().syncedOnce(function() {
			appSingleton.user.getFolders().syncedOnce(function() {
				fn();
			});
			});
			});
			});
		},
		
		onRequirementsMet: function()
		{
			this.trigger('next');
		},
		
		onProcess: function()
		{
			var that = this;

			if (!this.originals.length)
			{
				this.trigger('done');
				this.callbacks.success();
				this.callbacks = null;
				return;
			}
			
			var mailIdObject = this.originals.at(0);
			this.originals.remove(mailIdObject);
			
			// the syncVersion tells syncedOnce it is synced, we don't want that
			var original = new Original(_.omit(mailIdObject.toJSON(), 'syncVersion'));
			
			original.fetch();
			original.syncedOnce(function() {
				original.parseMime({ 
					success: function() {
						that.decryptAndProcess(original);
					},
					failure: that.callbacks.failure
				});
			});
		},

		decryptAndProcess: function(original)
		{
			var that = this;
			var decrypted = new DecryptedOriginal({}, { original: original });
			
			decrypted.toMail({ 
				success: function(mail) {
					that.seeIfDuplicateMailExists(original,mail);
				},
				failure: this.callbacks.failure
			});
		},
		
		seeIfDuplicateMailExists: function(original, mail)
		{
			var that = this;
			var existingMail = new Mail({ syncId: mail.id });
			existingMail.fetch({
				success: function() {
					that.mailAlreadyExists(original, mail, existingMail);
				},
				error: function() {
					that.putInContainers(original, mail);
				},
			});
		},
		
		mailAlreadyExists: function(original, mail, existingMail)
		{
			appSingleton.user.set("lastMailProcessed", mail.get('originalId'));
			
			if (existingMail.get('originalId')==null)
			{
				existingMail.set('originalId', original.id);
				
				var copy = ['content', 'from', 'to', 'cc', 'bcc', 'reply-to', 'date', 'subject' ];
				_.each (copy, function(c) {
					if (mail.has(c))
					existingMail.set(c, mail.get(c));
				});
				existingMail.save();
			}
			
			this.trigger('next');
		},
		
		putInContainers: function(original, mail)
		{
			var that = this;
			var user = appSingleton.user;
			mail.set('sent', original.get('sent'));
			mail.set('received', !original.get('sent'));

			var conversations = appSingleton.user.getConversations();

			var subject = mail.getTrimmedSubject();
			var matchings = subject ? conversations.where({subject: subject }) : null;
			var conversation = matchings.length ? matchings[0] : null;

			if (!conversation)
			{
				conversation = new Conversation({user:appSingleton.user.id, syncId:Util.guid(), subject:subject });
				conversations.add(conversation);
			}

			conversation.getMails().syncedOnce(function() {
			conversation.getReferences().syncedOnce(function() {
			user.getContacts().syncedOnce(function() {
				
				// add the mail
				conversation.getMails().add(mail);
				mail.set('conversation', conversation.id);
				
				// recompute the dictionary, fields of the conversation
				conversation.recomputeAttributesAndFolderMemberships();
				
				// go through the contacts in the mail and add them
				_.each (mail.getEmailAddresses(), function(email) {
					user.getContacts().ensureContact(email);
				});
				
				// save things
				appSingleton.user.set("lastMailProcessed", mail.get('originalId'));

				conversation.save();
				mail.save();
				appSingleton.user.save();
				
				that.trigger('next');
				
			});});});
		}
	});
	
});
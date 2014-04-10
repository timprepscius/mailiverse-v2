mv (aka: mailiverse.v2)

==

This project is a PGP mail service which caches using AES to provide a UI of the standard, "click on
folder, see conversations instantaneously, etc etc."

It uses Backbone for the model/view architecture.  The backone syncronization code is overridden before
ajax is performed to encrypt and decrypt the models as they are transfered.

My hope is that, anyone will be able to change the look and feel of the application by changing the
css and the templates from which the user interface is built.  (look in client/web/WebContent/templates
and client/web/WebContent/css).

My hope is also to demonstrate how any service built using backbone can easily use encryption, with
almost no modifications in existing code.

==

There is NO nginx ssl, this is on purpose.  Everyone will need to do their own.  I will probably eventually
include some sort of script to generate default certs.

===

Progress:

04/09/2014 - Working on checking signatures, debugging openpgpjs.
 * Checking signatures works with all examples I have at this point.  Yay!   Wow that was a lot of work.
 * Decryption is continuing to work with the examples I have, but do not have enough examples.
 * Changed key scheme again, I think I need to make a KeyChain object which signifies when a key chain has been completely
retreived from a pgp key server.  Not sure, will think more.  This is now done.
 * KeyChain is really now just a mirror of the pgp keyserver information.  If things work correctly every so
often (currently every day), the pgp server will be re-visited when you receive or send mail to a known contact. 
 * Encoding uses the mozilla charset encoding source, so now the "us-ascii", "jp-blahblah" and so on decode correctly.  Wow that
was a lot of work as well.
 * Sorting of conversations does appear to be working now, needs more testing
 * Key adding has been revisited, as well as KeyChain.  I think they are close to a "good" version.

Things to work on next:
 * I'm still not detecting when a pgp encrypted with embedded signature is signed.  I should.  OpenPGP is telling me, I just
need to record it.

03/30/2014 - Work on sending encrypted/signed/text only
 * Signing mail is optional
 * Encrypting mail is optional
 * Sending text only is optional
 * Changed the way that keys work, before the meta data for a key was included with the pgp crypto block.  Now
the crypto is in a KeyCrypto record.  This allows me to load all known keys quickly.  Have big pgp blocks which I
look up only when needed.
 * Creates a "Keys" modal dialog which shows all the keys you know about, and allows you to add one manually.
 * Checking signatures is working with all but one test case.  Not sure why.
 * Odds and ends, pre blocks have word wrap. (prob should have a different word wrap)

Things to work on next:
 * I'm not detecting when a pgp encrypted with embedded signature is signed.  I should.  OpenPGP is telling me, I just
need to record it.
 * The sorting of conversations doesn't update correctly.  (immediately after I reply to in a conversation)
 * need to remove quotes from nick-names.
 * start thinking about attachments.

03/23/2014 - Work on stability
 * Signs mail a bit more correctly, will canonicalize in next batch of fixes.
 * Does infinite scrolling of conversations correctly.
 * Fixes lots of data creation/initialization bugs.
 * Integrates mail ids so that duplicate mails are correctly detected.
 * Folder listings seem to be correct.

03/15/2014 - Initial git push.
 * Decrypts mail sent using gpg/applemail.
 * Decrypts mail which have the ---- PGP * END ---- blocks.
 * Checks signatures of ---- PGP * END ---- blocks.
 * Checks signatures of gpg/applemail
      Marks only sections of mail which are signed with a green lock.
 * There are cases of multipart/signed which fail.  (see example mail 2)
 * Encrypts mail with text & html blocks using PGP.  Correctly deciphered by gpg/applemail. 
      However, only tested with small messages.  Problems may arise with \r\n messages, etc, encodings.
 * Looks up PGP keys using the mit pgp server.
 * Keys which are ONLY found from server are Orange, keys which have been used to check a signature are Green.
 * Decodes QP inlines in the subject, haven't applied this to mail bodies yet.   

Todo:
 * Public keys are not automatically registered on the pgp key servers.  Don't want to enable until semi-permanent I think.
 * Signing mail with text & html blocks using PGP.  The signature is too small to be correct.  But GPG
   somehow accepts it.  Which I find disturbing.
 * QP all around.
 * Re-enable web worker.
 * Backbone paging of conversations.
 * ... 
 * infinite
 * ...

===

Build and deploy:

Requirements:
 * Ant: The automated build uses Ant.

 * The setup assumes that you have public/privatekey ssh access to the root account of the target computer.
There is a script "copy_rsa_from_ssh_keys" which will copy your public key for the setup scripts to use.

 * The setup scripts use apt-get, so.. ubuntu.

Setup:
 1. echo "target-machine-name" > host-name
 2. make sure you have pub/priv key access to root/ubuntu of the target machine - ssh ubuntu@target-machine - must work
 3. cd setup
 4. (cd requirements && ./copy_rsa_from_ssh_keys)
 5. ./setup-server

If you want to use special keys (not your own), you need to put the pub in that directory and modify the config file.

Build:
 0. (cd server/ext && ./setup)
 1. cd server
 2. ./build

Deploy:
 1. cd deploy
 2. ./server-deploy

===

Encryption:

The encryption is broken into three segments, user authentication and key retrieval via PBE 
(SHA-256, 32768 iterations), caching via AES-256, and mail encryption via PGP (2048) bit.

To view the user authentication look at:
client/web/WebContent/js/view/SignupView.js & LoginView.js

To view the AES-256 encryption look at:
client/web/WebContent/js/mech/BackboneEncryption.js  

To view the PGP encryption look at:
client/web/WebContent/js/mech/MailReceiver.js & MailSender.js

===

Backbone:

At this point in development, the entire source tree is fluid.
I feel that, as I deal with paging infinite conversations, I will probably need to make changes to the model view architecture.

Having said that, I believe I have followed conventions, and have created a source tree with a very low learning curve.

The AppView contains the MainView, the MainView contains the Folders/Conversations etc.




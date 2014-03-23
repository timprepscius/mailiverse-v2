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

03/23/2014 - Work on stability
 * Signs mail a bit more correctly, will canonicalize in next batch of fixes.
 * Does infinite scrolling of conversations correctly.
 * Fixes lots of data creation/initialization bugs.
 * Integrates mail ids so that mails are correctly read.
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



